export const COMPONENT_WHITELIST = [
    'Button',
    'Card',
    'Chart',
    'Input',
    'Modal',
    'Navbar',
    'Sidebar',
    'Table',
    'Textarea',
    'Container',
    'Grid',
    'Inline',
    'Section',
    'Stack'
] as const;

export const LAYOUT_PRIMITIVES = [
    'Container',
    'Grid',
    'Inline',
    'Section',
    'Stack'
];

export const ALLOWED_IMPORTS = [
    'react',
    'lucide-react',
    ...LAYOUT_PRIMITIVES.map(p => `../layout-primitives/${p}`),
    ...[
        'Button',
        'Card',
        'Chart',
        'Input',
        'Modal',
        'Navbar',
        'Sidebar',
        'Table',
        'Textarea'
    ].map(c => `../components/${c}`)
];

