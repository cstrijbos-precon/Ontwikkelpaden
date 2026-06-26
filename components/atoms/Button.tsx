import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "rounded-md font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "py-2.5 px-4 bg-blue-600 text-white hover:bg-blue-700",
    ghost: "py-2 px-3 text-slate-600 hover:bg-slate-100",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
