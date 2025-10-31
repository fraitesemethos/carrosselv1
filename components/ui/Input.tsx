import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  const baseClasses = "w-full p-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition duration-200";
  
  return (
    <input className={`${baseClasses} ${className}`} {...props} />
  );
};

export default Input;