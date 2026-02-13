import express, { Request, Response } from 'express';
import cors from 'cors';
import { runPlanner } from './agent/planner';
import { runGenerator } from './agent/generator';
import { runExplainer } from './agent/explainer';
import { runValidator } from './agent/validator';
import * as versionStore from './agent/versionStore';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Mock Data Storage (In-memory)
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
    name: "Professional AI Interface Design",
    branch: "main",
    status: "active"
};

const fileList = [
    { name: "App.tsx", type: "file" },
    { name: "components/Hero.tsx", type: "file" },
    { name: "design-system/tokens.css", type: "file" }
];

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
        const { prompt, previousPlan } = req.body;

        // 1. Add user message to history
        const newMessage = {
            id: chatMessages.length + 1,
            role: 'user',
            content: prompt,
            timestamp: new Date().toLocaleTimeString()
        };
        chatMessages.push(newMessage as any);

        // 2. Run Pipeline (Asynchronous)
        const plan = await runPlanner(prompt, previousPlan);
        const code = await runGenerator(prompt, plan);
        const explanation = await runExplainer(prompt, plan, previousPlan);
        const validation = await runValidator(code);


        if (!validation.valid) {
            console.warn("Generated code failed mock validation:", validation.errors);
        }

        // 3. Update Global State
        currentCode = code;

        const parsedPlan = JSON.parse(plan);

        // Save to version store
        versionStore.addVersion(prompt, parsedPlan, code, explanation);

        const planSummary = `
### 🏗️ Design Plan
**Intent**: ${parsedPlan.intent}
**Steps**:
${parsedPlan.steps.map((s: string) => `- ${s}`).join('\n')}

**Components**: ${parsedPlan.componentsToUse.join(', ')}
**Strategy**: ${parsedPlan.layoutStrategy}

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

        // 4. Return combined result as requested
        res.json({
            plan: parsedPlan,
            code,
            explanation
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
    res.json({
        status: "rolled_back",
        version
    });
});

app.get('/api/versions', (req: Request, res: Response) => {
    res.json(versionStore.getAllVersions());
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
