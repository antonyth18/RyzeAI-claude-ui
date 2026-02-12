import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'compact' | 'normal' | 'spacious';
}

export function Section({ children, className = '', spacing = 'normal' }: SectionProps) {
  const spacingMap = {
    compact: 'py-12',
    normal: 'py-16',
    spacious: 'py-24',
  };
  
  return (
    <section className={`${spacingMap[spacing]} ${className}`}>
      {children}
    </section>
  );
}

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Container({ children, className = '', size = 'md' }: ContainerProps) {
  const sizeMap = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
  };
  
  return (
    <div className={`${sizeMap[size]} mx-auto px-6 ${className}`}>
      {children}
    </div>
  );
}
