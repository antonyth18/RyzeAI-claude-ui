import React from 'react';

interface SidebarProps {
    children: React.ReactNode;
    className?: string;
}

export function Sidebar({ children, className = '' }: SidebarProps) {
    return (
        <aside className={`sidebar ${className}`}>
            {children}
        </aside>
    );
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
    return (
        <div className="panel-header" style={{ height: '64px' }}>
            {children}
        </div>
    );
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="panel-content">
            {children}
        </div>
    );
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            {children}
        </div>
    );
}

interface SidebarItemProps {
    children: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
}

export function SidebarItem({ children, active = false, onClick }: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
            style={{ width: 'calc(100% - var(--space-4))', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
        >
            {children}
        </button>
    );
}
