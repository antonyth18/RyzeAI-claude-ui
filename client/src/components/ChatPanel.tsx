import React from 'react';

export function ChatPanel() {
    return (
        <div className="panel">
            <div className="panel-header">Chat</div>
            <div className="panel-content">
                <div className="stack-md">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="chat-bubble">
                            <strong>User:</strong> Message {i + 1}. This is a deterministic chat bubble without tailwind.
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
