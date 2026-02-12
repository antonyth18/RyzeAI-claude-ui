import React from 'react';

export function PreviewPanel() {
    return (
        <div className="panel">
            <div className="panel-header">Preview</div>
            <div className="panel-content">
                <div className="stack-md">
                    <div className="card">
                        <h3 className="card-title">Project Status</h3>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-subtle)' }}>
                            Deterministic CSS system active.
                        </p>
                    </div>
                    <div className="grid-2">
                        <div className="card">Metric A</div>
                        <div className="card">Metric B</div>
                    </div>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="card" style={{ opacity: 0.7 }}>
                            Sample Item {i + 1}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
