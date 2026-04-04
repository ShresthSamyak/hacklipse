import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  className?: string;
  outline?: boolean;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', outline = true, ...props }) => {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: outline ? "'FILL' 0" : "'FILL' 1" }}
      {...props}
    >
      {name}
    </span>
  );
};
