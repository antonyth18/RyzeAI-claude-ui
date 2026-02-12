import React from 'react';

interface GridProps {
    children: React.ReactNode;
    cols?: number;
    gap?: string;
    className?: string;
}

export const Grid: React.FC<GridProps> = ({ children, cols = 2, gap, className = '' }) => {
    return (
        <div
            className={`grid-${cols} ${className}`}
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: gap
            }}
        >
            {children}
        </div>
    );
};
