import Groq from "groq-sdk";
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

const COMPONENT_WHITELIST = ['Button', 'Card', 'Input', 'Textarea', 'Table', 'Modal', 'Sidebar', 'Navbar', 'Chart'];

export async function runGenerator(prompt: string, plan: string): Promise<string> {
  const systemPrompt = `
You are an expert React Developer. Your task is to generate the code for a single React component named 'GeneratedComponent' based on a provided Design Plan.

STRICT CONSTRAINTS:
1. ONLY use components from this whitelist: ${COMPONENT_WHITELIST.join(', ')}.
2. Use standard lowercase HTML elements (div, section, header, nav, footer, p, h1-h6, etc.).
3. DO NOT capitalize standard HTML tags (e.g., use <section>, NOT <Section>).
4. ABSOLUTELY NO DOM interface names as component tags (e.g., NO <HTMLInputElement />).
5. Import components from '../components/[ComponentName]' ONLY.
6. Use Tailwind CSS for ALL styling.
7. ABSOLUTELY NO inline styles (no 'style={{...}}').
8. NO external imports other than 'react' and authorized components.
9. Return ONLY the code. No markdown fences, no explanations.

WHITELISTED COMPONENTS:
${COMPONENT_WHITELIST.map(c => `- ${c}`).join('\n')}

Example Import:
import { Button } from '../components/Button';
`;

  const userPrompt = `
User Intent: "${prompt}"
Design Plan: 
${plan}

Generate the React component code.
`;

  try {
    const chatCompletion = await getGroq().chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
    });

    let code = chatCompletion.choices[0]?.message?.content || "";

    // Strip markdown fences if present
    if (code.includes('```')) {
      code = code.replace(/```[a-z]*\n?/g, '').replace(/\n?```/g, '').trim();
    }

    // Log the generated code for debugging purposes
    console.log("--- GENERATED CODE ---\n", code, "\n--- END GENERATED CODE ---");

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
  // 1. Check for inline styles (e.g., style={{...}})
  if (/style\s*=\s*{/.test(code)) {
    throw new Error("Inline styles are strictly forbidden. Use Tailwind CSS classes instead.");
  }

  // 2. Check for disallowed components
  const componentUsage = code.match(/<([A-Z][a-zA-Z0-9]*)/g);
  if (componentUsage) {
    const usedComponents = [...new Set(componentUsage.map(c => c.slice(1)))];

    // Whitelist and standard HTML tags that might be capitalized by LLMs
    const allowedStandardTags = ['div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'section', 'nav', 'header', 'main', 'footer', 'ul', 'li', 'ol', 'label', 'form', 'a', 'img'];

    const invalidComponents = usedComponents.filter(c => {
      const lowerC = c.toLowerCase();
      // If it's in our whitelist, it's fine
      if (COMPONENT_WHITELIST.includes(c as any)) return false;
      // If it's a standard HTML tag (even if capitalized), we'll allow it but prefer lowercase
      if (allowedStandardTags.includes(lowerC)) return false;
      // Otherwise, it's an unknown component
      return true;
    });

    if (invalidComponents.length > 0) {
      throw new Error(`Unknown or disallowed components detected: ${invalidComponents.join(', ')}`);
    }
  }

  // 3. Check for additional imports (only React and whitelisted components allowed)
  const imports = code.match(/import\s+.*\s+from\s+['"].*['"]/g) || [];
  for (const imp of imports) {
    if (!imp.includes('react') && !imp.includes('../components/')) {
      throw new Error(`External or disallowed imports detected: ${imp}`);
    }
  }
}
