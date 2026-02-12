import React from 'react';

interface StackProps {
    children: React.ReactNode;
    gap?: string;
    className?: string;
}

export const Stack: React.FC<StackProps> = ({ children, gap, className = '' }) => {
    return (
        <div
            className={`stack-md ${className}`}
            style={gap ? { gap } : undefined}
        >
            {children}
        </div>
    );
};
