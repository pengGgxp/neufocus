import React from 'react';
import { Check } from 'lucide-react';

interface NeuProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
}

// Terminal Card: Solid black, green border, scanline effect hint
export const NeuCard: React.FC<NeuProps> = ({ children, className = '', active, ...props }) => (
  <div 
    className={`
      bg-black
      border border-neu-dark
      shadow-term
      text-neu-text
      transition-all duration-300 
      relative overflow-hidden
      ${active ? 'border-neu-accent shadow-[0_0_20px_rgba(0,255,65,0.2)]' : 'border-neu-dark'} 
      ${className}
    `} 
    {...props}
  >
    {/* Corner accents */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neu-accent/50"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neu-accent/50"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neu-accent/50"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neu-accent/50"></div>
    {children}
  </div>
);

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'default';
  active?: boolean;
}

// Terminal Button: Square, uppercase, hover invert
export const NeuButton: React.FC<NeuButtonProps> = ({ children, className = '', variant = 'default', active, ...props }) => {
  let colorClass = 'border-neu-text/50 text-neu-text hover:bg-neu-text hover:text-black';
  
  if (variant === 'primary') colorClass = 'border-neu-accent text-neu-accent hover:bg-neu-accent hover:text-black shadow-[0_0_10px_rgba(0,255,65,0.2)]';
  if (variant === 'danger') colorClass = 'border-neu-danger text-neu-danger hover:bg-neu-danger hover:text-black';
  if (variant === 'success') colorClass = 'border-neu-success text-neu-success hover:bg-neu-success hover:text-black';

  return (
    <button
      className={`
        px-6 py-2 
        border 
        uppercase tracking-widest font-mono text-sm font-bold
        transition-all duration-100 ease-in-out outline-none
        active:translate-y-[2px]
        ${active ? 'bg-neu-text/20' : ''}
        ${colorClass}
        ${className}
      `}
      {...props}
    >
      <span className="flex items-center gap-2">
        {active && <span className="animate-blink">_</span>}
        {children}
      </span>
    </button>
  );
};

// Terminal Input: Bottom border only or box
export const NeuInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={`
      w-full 
      bg-black 
      border-b-2 border-neu-dark
      px-4 py-3 
      outline-none 
      font-mono text-neu-text placeholder-neu-text/30
      focus:border-neu-accent focus:bg-neu-accent/5
      transition-all 
      ${className}
    `}
    {...props}
  />
);

export const NeuSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
  <select
    className={`
      w-full 
      bg-black 
      border-b-2 border-neu-dark
      px-4 py-3 
      outline-none 
      font-mono text-neu-text cursor-pointer appearance-none 
      focus:border-neu-accent focus:bg-neu-accent/5
      transition-all
      ${className}
    `}
    {...props}
  />
);

interface NeuCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const NeuCheckbox: React.FC<NeuCheckboxProps> = ({ checked, onChange, className = '' }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`
      w-6 h-6 flex items-center justify-center 
      transition-all shrink-0 outline-none border border-neu-text/50
      ${checked ? 'bg-neu-accent text-black border-neu-accent' : 'bg-transparent hover:border-neu-accent'} 
      ${className}
    `}
  >
    {checked && <Check size={16} strokeWidth={4} />}
  </button>
);
