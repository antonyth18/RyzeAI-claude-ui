export async function runValidator(code: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. Block high-risk security items
    if (code.includes('dangerouslySetInnerHTML')) {
        errors.push("Security Violation: dangerouslySetInnerHTML is forbidden.");
    }

    if (/<script/i.test(code)) {
        errors.push("Security Violation: <script> tags are forbidden.");
    }

    if (/<iframe/i.test(code)) {
        errors.push("Security Violation: <iframe> tags are forbidden.");
    }

    // Block inline JS event strings (on* attributes)
    if (/\son[a-z]+\s*=\s*['"][^'"]*['"]/i.test(code)) {
        errors.push("Security Violation: Inline JavaScript event strings are forbidden.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
