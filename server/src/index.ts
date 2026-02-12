import express, { Request, Response } from 'express';
import cors from 'cors';
import { runPlanner } from './agent/planner';
import { runGenerator } from './agent/generator';
import { runExplainer } from './agent/explainer';
import { runValidator } from './agent/validator';

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
        const { prompt } = req.body;

        // 1. Add user message to history
        const newMessage = {
            id: chatMessages.length + 1,
            role: 'user',
            content: prompt,
            timestamp: new Date().toLocaleTimeString()
        };
        chatMessages.push(newMessage as any);

        // 2. Run Pipeline (Asynchronous)
        const plan = await runPlanner(prompt);
        const code = await runGenerator(prompt, plan);
        const explanation = await runExplainer(prompt, code);
        const validation = await runValidator(code);

        if (!validation.valid) {
            console.warn("Generated code failed mock validation:", validation.errors);
        }

        // 3. Update Global State
        currentCode = code;
        const aiMessage = {
            id: chatMessages.length + 1,
            role: 'assistant',
            content: explanation,
            timestamp: new Date().toLocaleTimeString()
        };
        chatMessages.push(aiMessage as any);

        // 4. Return combined result as requested
        res.json({
            plan,
            code,
            explanation
        });
    } catch (error) {
        console.error("Agent Pipeline Error:", error);
        res.status(500).json({ error: "Pipeline failed" });
    }
});

app.post('/api/agent/refactor', (req: Request, res: Response) => {
    res.json({ status: "refactoring_started" });
});

app.post('/api/agent/regenerate', (req: Request, res: Response) => {
    res.json({ status: "regenerating" });
});

app.post('/api/version/rollback', (req: Request, res: Response) => {
    res.json({ status: "rolled_back" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
