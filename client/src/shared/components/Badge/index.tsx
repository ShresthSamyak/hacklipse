import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'neutral';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  pulse = false, 
  className = '',
  ...props 
}) => {
  const baseClasses = "inline-flex items-center gap-2 px-3 py-1 font-headline uppercase tracking-widest text-[0.65rem]";
  
  const variants = {
    primary: "bg-surface-high border-l-2 border-primary text-primary",
    secondary: "bg-secondary-container/20 border-l-2 border-secondary text-secondary",
    neutral: "bg-surface-high text-on-surface-variant border-none"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
      {pulse && variant === 'primary' && (
        <span className="w-1.5 h-1.5 bg-primary rounded-none animate-pulse"></span>
      )}
    </div>
  );
};
