import Groq from "groq-sdk";
import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Groq lazily to ensure environment variables are loaded and for easier testing
let groq: Groq | null = null;

export function _resetModel() {
    groq = null;
}

function getGroq() {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY || '';
        groq = new Groq({ apiKey });
    }
    return groq;
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

export async function runPlanner(userIntent: string, previousPlan?: any): Promise<string> {
    const stringifiedPreviousPlan = typeof previousPlan === 'object' ? JSON.stringify(previousPlan, null, 2) : previousPlan;

    const systemPrompt = `
You are an expert Frontend Architect. Your job is to create a high-level plan for building a UI based on the user's intent.
Your output MUST be a strict JSON object. No markdown, no prose, no React code, and no JSX.

INCREMENTAL UPDATES:
- If a "Previous Plan" is provided, do NOT recreate the entire layout from scratch.
- PRESERVE existing components that are still relevant.
- Only APPLY modifications, adds, or removals requested in the current "User Intent".
- The final JSON should be a MERGED representation of the entire UI, including old and new parts.

RULES:
1. Components MUST ONLY be selected from this whitelist: ${COMPONENT_WHITELIST.join(', ')}.
2. Output MUST follow this JSON structure:
{
  "intent": "Brief description of the CUMULATIVE user goal",
  "steps": ["Step 1", "Step 2", ...],
  "componentsToUse": ["Component1", "Component2", ...],
  "layoutStrategy": "Description of container/grid layout",
  "explanation": "Briefly explain the incremental changes made"
}
3. Do NOT output any XML-like tags, <> or </>.
4. If the user request is unclear, create a plan for a generic dashboard card.

WHITELISTED COMPONENTS:
${COMPONENT_WHITELIST.map(c => `- ${c}`).join('\n')}
`;

    const userPrompt = `
${stringifiedPreviousPlan ? `### PREVIOUS STATE:\n${stringifiedPreviousPlan}\n\n### USER MODIFICATION REQUEST:\n"${userIntent}"` : `### NEW PROJECT REQUEST:\n"${userIntent}"`}

Generate the updated CUMULATIVE JSON UI plan.
`;

    try {
        const chatCompletion = await getGroq().chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        let rawContent = chatCompletion.choices[0]?.message?.content || "";

        if (!rawContent) {
            throw new Error("Groq returned an empty response.");
        }

        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(rawContent);
        } catch (e) {
            console.error("Failed to parse Groq content:", rawContent);
            throw new Error("Failed to parse Groq response as JSON.");
        }

        // Validate structure and whitelist with Zod
        const validationResult = PlanSchema.safeParse(parsedData);
        if (!validationResult.success) {
            console.error("Validation failed:", validationResult.error.format());
            throw new Error(`Invalid plan structure or unknown component types selected: ${validationResult.error.message}`);
        }

        return JSON.stringify(validationResult.data, null, 2);
    } catch (error: any) {
        console.error("Error in runPlanner (Groq):", error.message);

        if (error.status === 429) {
            throw new Error("Groq API Rate Limit Exceeded. Please wait a moment and try again.");
        }

        if (error.message.includes("API key") || error.status === 401) {
            throw new Error("Groq API Key is missing or invalid. Please check your .env file.");
        }
        throw error;
    }
}
