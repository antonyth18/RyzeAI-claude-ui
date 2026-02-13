/**
 * Sanitizes user prompts to prevent prompt injection and system overrides.
 */
export function sanitizePrompt(prompt: string): string {
    if (!prompt) return "";

    // 1. Remove ignore/system override attempts (case-insensitive)
    const injectionPatterns = [
        /ignore previous instructions/gi,
        /ignore all instructions/gi,
        /system prompt/gi,
        /override/gi,
        /act as a/gi,
        /forget your/gi,
        /you are now/gi,
        /disregard/gi
    ];

    let sanitized = prompt;
    for (const pattern of injectionPatterns) {
        sanitized = sanitized.replace(pattern, "[CLEANED]");
    }

    // 2. Trim and normalize whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');

    return sanitized;
}
