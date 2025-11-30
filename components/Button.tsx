import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  icon,
  className = '',
  ...props 
}) => {
  // Mudança: rounded-md em vez de rounded-lg para visual mais sério
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Primary agora é Vermelho Corporativo
    primary: "bg-red-700 text-white hover:bg-red-800 focus:ring-red-500 shadow-sm",
    // Secondary é Cinza neutro
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-300 shadow-sm",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500 border border-transparent",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-200 focus:ring-gray-400"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs uppercase tracking-wide", // Texto menor e uppercase para estilo técnico
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3 h-3 mr-1.5' : 'w-4 h-4 mr-2'}`} />
      ) : icon ? (
        <span className={`${size === 'sm' ? 'mr-1.5' : 'mr-2'}`}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};