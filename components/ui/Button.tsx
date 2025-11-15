
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyles = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

  const variantStyles = {
    primary: 'bg-brand-red text-white hover:bg-red-700 focus:ring-brand-red',
    secondary: 'bg-brand-gray text-white hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-600',
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
