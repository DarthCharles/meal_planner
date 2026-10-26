import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary:
    "bg-terracotta text-white shadow-[0_8px_18px_rgba(200,88,62,.2)] hover:bg-terracotta-dark",
  secondary: "bg-[#f5e6db] text-terracotta-dark",
  ghost: "bg-transparent text-muted",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border-0 px-4 py-3 text-[13px] font-bold transition-[transform,background] duration-150 hover:-translate-y-px ${variants[variant]} ${className}`}
    />
  );
}
