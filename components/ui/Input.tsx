
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    helpText?: string;
}

const Input: React.FC<InputProps> = ({ label, id, helpText, ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <input
                id={id}
                className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                {...props}
            />
            {helpText && (
                <p className="mt-1 text-xs text-gray-400">{helpText}</p>
            )}
        </div>
    );
};

export default Input;
