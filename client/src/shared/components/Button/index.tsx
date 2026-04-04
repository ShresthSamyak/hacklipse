import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseClasses = "px-8 py-4 font-headline font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2";
  const widthClass = fullWidth ? "w-full" : "w-auto";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-glow-primary",
    outline: "border border-primary/30 text-primary hover:bg-primary/10",
    ghost: "text-primary text-xs tracking-widest uppercase hover:gap-4 group"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
