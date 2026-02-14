import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { runPlanner } from './agent/planner';
import { runGenerator } from './agent/generator';
import { runExplainer } from './agent/explainer';
import { runValidator } from './agent/validator';
import * as versionStore from './agent/versionStore';
import { sanitizePrompt } from './utils/sanitizer';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Persistent Data Storage
const DB_DIR = path.join(__dirname, '../db');
const DB_PATH = path.join(DB_DIR, 'state.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let chatMessages = [
    { id: 1, role: 'assistant', content: 'Hello! I\'m your AI builder. How can I help you today?', timestamp: new Date().toLocaleTimeString() }
];

let currentCode = `import React from 'react';

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <p className="mt-4 text-gray-600">Start building your amazing project.</p>
    </div>
  );
}`;

const projectMeta = {
    name: "RyzenAI",
    branch: "main",
    status: "active"
};

const fileList = [
    { name: "App.tsx", type: "file" },
    { name: "components/Hero.tsx", type: "file" },
    { name: "design-system/tokens.css", type: "file" }
];

const saveState = () => {
    try {
        const state = {
            chatMessages,
            currentCode
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
    } catch (error) {
        console.error("Failed to save state:", error);
    }
};

const loadState = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            const state = JSON.parse(data);
            if (state.chatMessages) chatMessages = state.chatMessages;
            if (state.currentCode) currentCode = state.currentCode;
            console.log("[BACKEND] State loaded from disk.");
        }
    } catch (error) {
        console.error("Failed to load state:", error);
    }
};

// Load state on startup
loadState();

// If file didn't exist, we should save the default state
if (!fs.existsSync(DB_PATH)) {
    saveState();
}

// Endpoints
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.get('/api/chat/history', (req: Request, res: Response) => {
    res.json(chatMessages);
});

app.get('/api/code/current', (req: Request, res: Response) => {
    res.json({ code: currentCode });
});

app.get('/api/files', (req: Request, res: Response) => {
    res.json(fileList);
});

app.get('/api/project/meta', (req: Request, res: Response) => {
    res.json(projectMeta);
});

app.post('/api/agent/generate', async (req: Request, res: Response) => {
    try {
        const { prompt: rawPrompt, previousPlan } = req.body;

        // 1. Sanitize prompt
        const prompt = sanitizePrompt(rawPrompt);

        // 2. Add user message to history
        const newMessage = {
            id: chatMessages.length + 1,
            role: 'user',
            content: prompt,
            timestamp: new Date().toLocaleTimeString()
        };
        chatMessages.push(newMessage as any);

        saveState(); // Save state after adding user message

        // 3. Run Pipeline (Asynchronous)
        const plan = await runPlanner(prompt, previousPlan);
        const parsedPlan = JSON.parse(plan);

        console.log(`[BACKEND] Planner generated plan. Type: ${previousPlan ? 'Incremental (Operations Applied)' : 'Initial'}`);
        if (previousPlan) {
            console.log(`[BACKEND] Merged Plan Strategy: ${parsedPlan.layoutStrategy.substring(0, 50)}...`);
        }

        const code = await runGenerator(prompt, plan);
        const explanation = await runExplainer(prompt, plan, previousPlan);
        const validation = await runValidator(code);

        if (!validation.valid) {
            console.error("Security/Validation Failure:", validation.errors);
            throw new Error(`Security Violation: ${validation.errors.join(". ")}`);
        }

        // 3.1 UI Tree Pipeline
        // Parse the generated code into the canonical UI Tree
        const { parseJsxToTree, reconstructFullCode } = require('./agent/uiTree'); // Lazy load
        let uiTree;
        let finalCode = code;

        try {
            uiTree = parseJsxToTree(code);
            console.log("[BACKEND] Parsed JSX to UITree successfully.");

            // Re-serialize immediately to ensure canonical source of truth matches output
            // This ensures what we confirm to the user IS the tree's representation
            finalCode = reconstructFullCode(uiTree);
            console.log("[BACKEND] Reconstructed code from UITree.");
        } catch (treeError: any) {
            console.error("[BACKEND] Tree Parsing Failed:", treeError.message);
            console.warn("[BACKEND] Falling back to raw generated code (Tree feature degradation).");
            // We proceed with raw code if parsing fails to avoid blocking the user
            // But ideally this should not happen if generator follows constraints
            uiTree = null;
        }

        // 4. Update Global State
        // @ts-ignore
        currentCode = finalCode;
        console.log(`[BACKEND] Code updated successfully for prompt: "${prompt.substring(0, 30)}..."`);
        console.log(`[BACKEND] Current Code Length: ${currentCode.length}`);

        // Save to version store
        const newVersion = versionStore.addVersion(prompt, parsedPlan, finalCode, uiTree!, explanation);
        console.log(`[BACKEND] Version saved. Total versions: ${versionStore.getAllVersions().length}`);

        const planSummary = `
### 🏗️ Design Plan
**Intent**: ${parsedPlan.intent}
**Steps**:
${parsedPlan.steps.map((s: string) => `- ${s}`).join('\n')}

**Layout Strategy**: ${parsedPlan.layoutStrategy}
**Components**: ${parsedPlan.componentsToUse.join(', ')}

---
${explanation}
        `.trim();

        const aiMessage = {
            id: chatMessages.length + 1,
            role: 'assistant',
            content: planSummary,
            timestamp: new Date().toLocaleTimeString()
        };
        chatMessages.push(aiMessage as any);

        saveState(); // Save state after adding AI message and updating code

        // 4. Return combined result as requested
        res.json({
            plan: parsedPlan,
            code,
            explanation,
            version: newVersion
        });

    } catch (error: any) {
        console.error("Agent Pipeline Error:", error);

        const isQuotaError = error.message.includes("Quota Exceeded") || error.message.includes("429") || error.message.includes("rate limits");
        const status = isQuotaError ? 429 : 500;

        res.status(status).json({ error: error.message || "Pipeline failed" });
    }
});


app.post('/api/agent/refactor', (req: Request, res: Response) => {
    res.json({ status: "refactoring_started" });
});

app.post('/api/agent/regenerate', (req: Request, res: Response) => {
    res.json({ status: "regenerating" });
});

app.post('/api/version/rollback', (req: Request, res: Response) => {
    const { id } = req.body;
    const version = versionStore.rollback(id);

    if (!version) {
        return res.status(404).json({ error: "Version not found" });
    }

    currentCode = version.code;
    saveState(); // Save state after rollback
    res.json({
        status: "rolled_back",
        version
    });
});

app.get('/api/versions', (req: Request, res: Response) => {
    res.json(versionStore.getAllVersions());
});

// Serve static frontend in production
const CLIENT_BUILD_PATH = path.join(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(CLIENT_BUILD_PATH));

    app.get(/.*/, (req: Request, res: Response) => {
        res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
