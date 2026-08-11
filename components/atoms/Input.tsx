import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-[color:var(--blauw-accent)] ${className}`}
      {...props}
    />
  );
}
