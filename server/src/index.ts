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

interface FileState {
  chatMessages: any[];
  currentCode: string;
}

let fileStates: Record<string, FileState> = {
  'App.tsx': {
    chatMessages: [
      { id: 1, role: 'assistant', content: 'Hello! I\'m your AI builder. How can I help you today?', timestamp: new Date().toLocaleTimeString() }
    ],
    currentCode: `import React from 'react';

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <p className="mt-4 text-gray-600">Start building your amazing project.</p>
    </div>
  );
}`
  }
};

let fileList = [
  { name: "App.tsx", type: "file" }
];

const projectMeta = {
  name: "RyzenAI",
  branch: "main",
  status: "active"
};

const saveState = () => {
  try {
    const state = {
      fileStates,
      fileList
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
      if (state.fileStates) fileStates = state.fileStates;
      if (state.fileList) fileList = state.fileList;
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
  const fileName = (req.query.fileName as string) || 'App.tsx';
  res.json(fileStates[fileName]?.chatMessages || []);
});

app.get('/api/code/current', (req: Request, res: Response) => {
  const fileName = (req.query.fileName as string) || 'App.tsx';
  res.json({ code: fileStates[fileName]?.currentCode || "" });
});

app.get('/api/files', (req: Request, res: Response) => {
  res.json(fileList);
});

app.post('/api/files/create', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "File name required" });

  if (fileStates[name]) return res.status(400).json({ error: "File already exists" });

  fileStates[name] = {
    chatMessages: [
      { id: Date.now(), role: 'assistant', content: `Created ${name}. How can I help you build it?`, timestamp: new Date().toLocaleTimeString() }
    ],
    currentCode: `import React from 'react';\n\nexport default function Component() {\n  return (\n    <div className="p-8">\n      <h1 className="text-4xl font-bold">${name}</h1>\n      <p className="mt-4 text-gray-600">Start building your amazing component.</p>\n    </div>\n  );\n}`
  };

  fileList.push({ name, type: "file" });
  saveState();
  res.json({ status: "created", fileName: name });
});

app.get('/api/project/meta', (req: Request, res: Response) => {
  res.json(projectMeta);
});

app.delete('/api/files/:name', (req: Request, res: Response) => {
  const name = req.params.name as string;
  if (name === 'App.tsx') return res.status(400).json({ error: "Cannot delete the main App.tsx file" });

  if (!fileStates[name]) return res.status(404).json({ error: "File not found" });

  delete fileStates[name];
  fileList = fileList.filter(f => f.name !== name);

  versionStore.clearVersions(name); // Clear history for this file

  saveState();
  res.json({ status: "deleted", fileName: name });
});

app.post('/api/state/reset', (req: Request, res: Response) => {
  const defaultAppState = {
    chatMessages: [
      { id: 1, role: 'assistant', content: 'Hello! I\'m your AI builder. How can I help you today?', timestamp: new Date().toLocaleTimeString() }
    ],
    currentCode: `import React from 'react';

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <p className="mt-4 text-gray-600">Start building your amazing project.</p>
    </div>
  );
}`
  };

  fileStates = {
    'App.tsx': defaultAppState
  };

  fileList = [
    { name: "App.tsx", type: "file" }
  ];

  versionStore.clearVersions(); // Clear all version history

  saveState();
  res.json({ status: "reset_complete" });
});

app.post('/api/agent/generate', async (req: Request, res: Response) => {
  try {
    const { prompt: rawPrompt, previousPlan, fileName = 'App.tsx' } = req.body;

    if (!fileStates[fileName]) {
      fileStates[fileName] = { chatMessages: [], currentCode: "" };
    }

    // 1. Sanitize prompt
    const prompt = sanitizePrompt(rawPrompt);

    // 2. Add user message to history
    const newMessage = {
      id: fileStates[fileName].chatMessages.length + 1,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString()
    };
    fileStates[fileName].chatMessages.push(newMessage as any);

    saveState(); // Save state after adding user message

    // 3. Run Pipeline (Asynchronous)
    const plan = await runPlanner(prompt, previousPlan);
    const parsedPlan = JSON.parse(plan);

    console.log(`[BACKEND] Planner generated plan for ${fileName}. Type: ${previousPlan ? 'Incremental' : 'Initial'}`);

    // Get previous code for regeneration context
    const previousCode = fileStates[fileName]?.currentCode || "";
    const code = await runGenerator(prompt, plan, previousCode);
    const explanation = await runExplainer(prompt, plan, previousPlan);
    const validation = await runValidator(code);

    if (!validation.valid) {
      console.error("Security/Validation Failure:", validation.errors);
      throw new Error(`Security Violation: ${validation.errors.join(". ")}`);
    }

    // 4. Update File State
    fileStates[fileName].currentCode = code;

    // Save to version store (UITree is now null/disabled)
    const newVersion = versionStore.addVersion(fileName, prompt, parsedPlan, code, null as any, explanation);

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
      id: fileStates[fileName].chatMessages.length + 1,
      role: 'assistant',
      content: planSummary,
      timestamp: new Date().toLocaleTimeString()
    };
    fileStates[fileName].chatMessages.push(aiMessage as any);

    saveState();

    res.json({
      plan: parsedPlan,
      code,
      explanation,
      version: newVersion
    });

  } catch (error: any) {
    console.error("Agent Pipeline Error:", error);
    const isQuotaError = error.message.includes("Quota Exceeded") || error.message.includes("429") || error.message.includes("rate limits");
    res.status(isQuotaError ? 429 : 500).json({ error: error.message || "Pipeline failed" });
  }
});


app.post('/api/agent/refactor', (req: Request, res: Response) => {
  res.json({ status: "refactoring_started" });
});

app.post('/api/agent/regenerate', (req: Request, res: Response) => {
  res.json({ status: "regenerating" });
});

app.post('/api/version/rollback', (req: Request, res: Response) => {
  const { id, fileName = 'App.tsx' } = req.body;
  const version = versionStore.rollback(fileName, id);

  if (!version) {
    return res.status(404).json({ error: "Version not found" });
  }

  if (fileStates[fileName]) {
    fileStates[fileName].currentCode = version.code;
  }

  saveState();
  res.json({
    status: "rolled_back",
    version
  });
});

app.get('/api/versions', (req: Request, res: Response) => {
  const fileName = (req.query.fileName as string) || 'App.tsx';
  res.json(versionStore.getAllVersions(fileName));
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

