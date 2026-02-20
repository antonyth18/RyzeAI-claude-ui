import Groq from "groq-sdk";
import { withRetry } from '../utils/groqRetry';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let groq: Groq | null = null;

export function _resetGeneratorModel() {
  groq = null;
}

function getGroq() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY || '';
    groq = new Groq({ apiKey });
  }
  return groq;
}

import { COMPONENT_WHITELIST, ALLOWED_IMPORTS, LAYOUT_PRIMITIVES } from './constants';

export async function runGenerator(prompt: string, plan: string, previousCode: string = ""): Promise<string> {
  const systemPrompt = `
You are a senior frontend UI engineer and product designer.
Generate modern, production-ready React + Tailwind UI.

Requirements:
1. Strong visual hierarchy
2. Proper spacing (p-6, gap-6, space-y-6)
3. Rounded corners (rounded-xl or 2xl)
4. Soft shadows (shadow-md, shadow-lg)
5. Responsive layouts (flex, grid, max-w-*)
6. Avoid placeholder UI. NO "CustomComponent" tags unless defined in file.
7. Avoid flat gray blocks. Use gradients, glassmorphism, and depth.
8. Buttons must look premium.
9. Cards must have padding and depth.

STRICT CONSTRAINTS:
- IMPORT RULES: 
    - For components, use \`import { Name } from '../components/Name'\`
    - For layout primitives, use \`import { Name } from '../layout-primitives/Name'\`
    - For icons, use \`import { IconName } from 'lucide-react'\`
- Use Tailwind CSS for ALL styling. Do NOT use inline styles.
- Return ONLY the code. No markdown fences, no explanations.
- NO DIFFS: Do NOT use '+' or '-' prefixes. Return full, clean code only.
- STRICTLY ESM: Use \`import\` and \`export default\`. Do NOT use \`module.exports\` or \`require\`.
- COMPONENT NAMING: Avoid naming components 'Text', 'Image', or 'Navigation' as they collide with browser globals. Use 'Typography', 'AppImage', or 'NavBar' instead.
- Export the main component as 'default function App()'.
`;

  const userPrompt = `
${previousCode ? `### PREVIOUS CODE:\n${previousCode}\n\n` : ""}
### USER INTENT:
"${prompt}"

### DESIGN PLAN: 
${plan}

Generate the FULL updated React component code for 'App'. 
${previousCode ? "Maintain the overall structure of the previous code but apply the requested updates and ensure the highest visual quality." : "Create a STUNNING first version of the App."}
`;

  try {
    const chatCompletion = await withRetry(async () => {
      return await getGroq().chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile",
      });
    }, 3, 3000);

    let code = chatCompletion.choices[0]?.message?.content || "";

    // Strip markdown fences if present
    if (code.includes('```')) {
      code = code.replace(/```[a-z]*\n?/g, '').replace(/\n?```/g, '').trim();
    }

    // Strip common LLM "diff" artifacts if they accidentally leak through
    code = code.split('\n').map(line => {
      // Only strip if the line looks like a diff line and contains code-like structure
      // We want to avoid stripping math operators or legit leading characters
      if ((line.startsWith('+ ') || line.startsWith('- ')) && (line.includes('import ') || line.includes('<') || line.includes('{') || line.includes('function'))) {
        return line.substring(2);
      }
      return line;
    }).join('\n');

    // Validate the generated code
    validateGeneratedCode(code);

    return code;
  } catch (error: any) {
    console.error("Error in runGenerator (Groq):", error.message);
    if (error.status === 429) {
      throw new Error("Groq API Rate Limit Exceeded. Please wait a moment.");
    }
    throw error;
  }
}

function validateGeneratedCode(code: string) {
  // 1. Block high-risk security items
  if (code.includes('dangerouslySetInnerHTML')) {
    throw new Error("Security Violation: dangerouslySetInnerHTML is forbidden.");
  }

  if (/<script/i.test(code)) {
    throw new Error("Security Violation: <script> tags are forbidden.");
  }

  // Block inline JS event strings (on* attributes)
  if (/\son[a-z]+\s*=\s*['"][^'"]*['"]/i.test(code)) {
    throw new Error("Security Violation: Inline JavaScript event strings are forbidden.");
  }

  // Note: Standard PascalCase components and imports are now allowed by default.
  // We trust the LLM's creativity, only blocking actual injection risks.
}

