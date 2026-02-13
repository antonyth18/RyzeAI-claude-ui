const COMPONENT_WHITELIST = [
    'Button',
    'Card',
    'Input',
    'Textarea',
    'Table',
    'Modal',
    'Sidebar',
    'Navbar',
    'Chart',
    'Stack',
    'Inline',
    'Box'
];

const ALLOWED_IMPORTS = [
    'react',
    'lucide-react',
    '../layout-primitives/Stack',
    '../layout-primitives/Inline',
    '../layout-primitives/Box',
    '../../components/Button',
    '../../components/Card',
    '../../components/Input',
    '../../components/Textarea',
    '../../components/Table',
    '../../components/Modal',
    '../../components/Sidebar',
    '../../components/Navbar',
    '../../components/Chart'
];

export async function runValidator(code: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. Block inline styles
    if (/style\s*=\s*{/g.test(code)) {
        errors.push("Inline styles (style={{...}}) are strictly forbidden. Use Tailwind CSS classes instead.");
    }

    // 2. Strict Import Check
    const importMatches = code.matchAll(/import\s+.*\s+from\s+['"](.*)['"]/g);
    for (const match of importMatches) {
        const importPath = match[1];
        if (!ALLOWED_IMPORTS.includes(importPath)) {
            errors.push(`Unauthorized import detected: "${importPath}". Only standard UI components and layout primitives are allowed.`);
        }
    }

    // 3. Simple component usage check (regex-based for now)
    // This looks for <ComponentName but skips common HTML tags
    const jsxTagMatches = code.matchAll(/<([A-Z][a-zA-Z]*)/g);
    for (const match of jsxTagMatches) {
        const componentName = match[1];
        if (!COMPONENT_WHITELIST.includes(componentName)) {
            errors.push(`Unauthorized component used: "<${componentName}>". Please only use whitelisted UI components.`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
