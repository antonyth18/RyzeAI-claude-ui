import Groq from "groq-sdk";
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let groq: Groq | null = null;

export function _resetExplainerModel() {
    groq = null;
}

function getGroq() {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY || '';
        groq = new Groq({ apiKey });
    }
    return groq;
}

export async function runExplainer(userIntent: string, plan: string, previousPlan?: string): Promise<string> {
    const systemPrompt = `
You are a design-focused AI assistant. Your goal is to explain the design decisions made for a UI component in plain, professional English.

Explain:
1. The overall layout strategy (container/grid/flex approach).
2. The selection of components from the library and how they serve the intent.
3. If this is an update (indicated by a previous plan), highlight what was modified and why.

STRICT RULES:
- Use PLAIN ENGLISH only. No technical jargon unless necessary for UI context.
- NO code snippets, NO markdown fences (like \`\`\`), NO React syntax.
- Be concise and professional.
- Focus on the "Why" behind the "What".
`;

    const userPrompt = `
User Intent: "${userIntent}"
Current Design Plan (Flat Structure): 
${plan}

${previousPlan ? `Previous Design Plan Context:
${previousPlan}` : "This is a new component request."}

Provide a clear explanation of the design approach.
`;

    try {
        const chatCompletion = await getGroq().chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
        });

        return chatCompletion.choices[0]?.message?.content?.trim() || "";
    } catch (error: any) {
        console.error("Error in runExplainer (Groq):", error.message);
        if (error.status === 429) {
            throw new Error("Groq API Rate Limit Exceeded. Please wait a moment.");
        }
        throw error;
    }
}

