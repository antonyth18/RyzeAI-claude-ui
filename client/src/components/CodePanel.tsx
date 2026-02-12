import React from 'react';

export function CodePanel() {
    const code = `function DeterministicCSS() {
  const system = "fixed-classes";
  const styling = "predefined";
  return (\n    <div className="panel">\n      <h1>No Tailwind</h1>\n    </div>\n  );\n}

` + Array.from({ length: 30 }).map((_, i) => `// Fixed Line ${i + 12}\n`).join('');

    return (
        <div className="panel">
            <div className="panel-header">Code</div>
            <div className="panel-content" style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                <pre className="code-block">{code}</pre>
            </div>
        </div>
    );
}
