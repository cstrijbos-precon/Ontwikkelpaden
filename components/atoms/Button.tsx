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
  // Kleuren komen uit de huisstijl (styles/variables.css), niet uit de
  // Tailwind-standaardpalet.
  const variants = {
    primary: "py-2.5 px-4 text-white",
    ghost: "py-2 px-3 hover:bg-slate-100",
  };
  const kleuren =
    variant === "primary"
      ? { background: "var(--blauw)" }
      : { color: "var(--grijs)" };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={kleuren}
      {...props}
    >
      {children}
    </button>
  );
}
