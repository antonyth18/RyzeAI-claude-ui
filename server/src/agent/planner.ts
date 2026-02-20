import Groq from "groq-sdk";
import { withRetry } from '../utils/groqRetry';
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

import { COMPONENT_WHITELIST } from './constants';

// Zod schema for the plan
const PlanSchema = z.object({
    intent: z.string(),
    steps: z.array(z.string()),
    componentsToUse: z.array(z.string()),
    layoutStrategy: z.string(),
    explanation: z.string()
});

export type Plan = z.infer<typeof PlanSchema>;

export async function runPlanner(userIntent: string, previousPlan?: any): Promise<string> {
    const stringifiedPreviousPlan = typeof previousPlan === 'object' ? JSON.stringify(previousPlan, null, 2) : previousPlan;

    const systemPrompt = `
You are an expert Frontend Architect and UI Designer. Your job is to create a high-level plan for building a BEAUTIFUL, DETAILED, PREMIUM UI.

HIGH-FIDELITY REQUIREMENT:
- DO NOT plan for empty custom components (e.g., "HeroSection", "MetricCard").
- Plan for a functional visual hierarchy. 
- You can suggest using primitives like <Section>, <Grid>, <Stack>, and <Container>, but allow the generator to decide the final nesting for maximum visual quality.
- Treat every "component" as a functional area you will implement in detail using React + Tailwind.

VISUAL EXCELLENCE:
- Prioritize modern, high-end aesthetics (Vibrant colors, sleek dark modes, glassmorphism, smooth gradients).
- Design layouts that feel premium and state-of-the-art.
- Use whitespace, typography, and color harmony to create a "WOW" factor.

INCREMENTAL UPDATES:
- If a "Previous Plan" is provided, build upon it to satisfy the "User Intent".
- You can suggest full layout regenerations if needed to improve quality.

RULES:
1. Output MUST follow this JSON structure:
{
  "intent": "Brief description of the user goal",
  "steps": ["Step 1", "Step 2", ...],
  "componentsToUse": ["List of functional areas to build"],
  "layoutStrategy": "Description of the visual approach and styling strategy",
  "explanation": "Briefly explain the design choices"
}
2. Output MUST be strict JSON.
`;


    const userPrompt = `
${stringifiedPreviousPlan ? `### PREVIOUS STATE:\n${stringifiedPreviousPlan}\n\n### USER MODIFICATION REQUEST:\n"${userIntent}"` : `### NEW PROJECT REQUEST:\n"${userIntent}"`}

Generate the updated CUMULATIVE JSON UI plan.
`;

    try {
        const chatCompletion = await withRetry(async () => {
            return await getGroq().chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });
        }, 3, 3000);

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
