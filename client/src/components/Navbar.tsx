import React from 'react';

interface NavbarProps {
  brand: string;
  children?: React.ReactNode;
}

export function Navbar({ brand, children }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="card-title" style={{ margin: 0 }}>{brand}</div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-4)' }}>
        {children}
      </div>
    </nav>
  );
}
