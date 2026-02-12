import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize GenAI lazily to ensure environment variables are loaded and for easier testing
let model: any = null;

export function _resetModel() {
    model = null;
}

function getModel() {
    if (!model) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        const genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }
    return model;
}




// ... whitelist and schema remain same
const COMPONENT_WHITELIST = [
    'Button',
    'Card',
    'Input',
    'Textarea',
    'Table',
    'Modal',
    'Sidebar',
    'Navbar',
    'Chart'
] as const;

// Helper to check for JSX
const noJsx = (val: string) => !/<[a-zA-Z]/.test(val) && !/\/>/.test(val);
const noJsxMessage = "React/JSX code is strictly forbidden in the plan.";

// Zod schema for the plan
const PlanSchema = z.object({
    intent: z.string().refine(noJsx, noJsxMessage),
    steps: z.array(z.string().refine(noJsx, noJsxMessage)),
    componentsToUse: z.array(z.enum(COMPONENT_WHITELIST)),
    layoutStrategy: z.string().refine(noJsx, noJsxMessage),
    explanation: z.string().refine(noJsx, noJsxMessage)
});

export type Plan = z.infer<typeof PlanSchema>;

export async function runPlanner(userIntent: string, previousPlan?: string): Promise<string> {
    const systemPrompt = `
You are an expert Frontend Architect. Your job is to create a high-level plan for building a UI based on the user's intent.
Your output MUST be a strict JSON object. No markdown, no prose, no React code, and no JSX.

RULES:
1. Components MUST ONLY be selected from this whitelist: ${COMPONENT_WHITELIST.join(', ')}.
2. Output MUST follow this JSON structure:
{
  "intent": "Brief description of user goal",
  "steps": ["Step 1", "Step 2", ...],
  "componentsToUse": ["Component1", "Component2", ...],
  "layoutStrategy": "Description of container/grid layout",
  "explanation": "Why this approach was chosen"
}
3. Do NOT output any XML-like tags, <> or </>.
4. If the user request is unclear, create a plan for a generic dashboard card.

WHITELISTED COMPONENTS:
${COMPONENT_WHITELIST.map(c => `- ${c}`).join('\n')}
`;

    const userPrompt = `
User Intent: "${userIntent}"
${previousPlan ? `Previous Plan context: "${previousPlan}"` : ""}

Generate a strict JSON UI plan.
`;

    try {
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await getModel().generateContent(fullPrompt);
        const response = await result.response;
        let rawContent = response.text();

        // Gemini sometimes includes markdown fences, strip them if present
        if (rawContent.includes('```json')) {
            rawContent = rawContent.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
        } else if (rawContent.includes('```')) {
            rawContent = rawContent.replace(/```\n?/, '').replace(/\n?```/, '').trim();
        }


        if (!rawContent) {
            throw new Error("Gemini returned an empty response.");
        }

        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(rawContent);
        } catch (e) {
            console.error("Failed to parse Gemini content:", rawContent);
            throw new Error("Failed to parse Gemini response as JSON.");
        }

        // Validate structure and whitelist with Zod
        const validationResult = PlanSchema.safeParse(parsedData);
        if (!validationResult.success) {
            console.error("Validation failed:", validationResult.error.format());
            throw new Error(`Invalid plan structure or unknown component types selected: ${validationResult.error.message}`);
        }

        return JSON.stringify(validationResult.data, null, 2);
    } catch (error: any) {
        console.error("Error in runPlanner (Gemini):", error.message);

        if (error.message.includes("API key not valid")) {
            throw new Error("Google API Key is missing or invalid. Please check your .env file.");
        }
        throw error;
    }
}
