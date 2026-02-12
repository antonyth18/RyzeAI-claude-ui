import React from 'react';

interface InlineProps {
    children: React.ReactNode;
    gap?: string;
    align?: 'flex-start' | 'center' | 'flex-end';
    className?: string;
}

export const Inline: React.FC<InlineProps> = ({ children, gap, align, className = '' }) => {
    return (
        <div
            className={`inline-md ${className}`}
            style={{
                gap: gap,
                alignItems: align
            }}
        >
            {children}
        </div>
    );
};
