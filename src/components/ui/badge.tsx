type BadgeVariant = "default" | "sage" | "sky" | "peach" | "success" | "warning" | "danger" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  sage: "bg-sage-50 text-sage-700",
  sky: "bg-sky-50 text-sky-700",
  peach: "bg-peach-50 text-peach-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-yellow-50 text-yellow-700",
  danger: "bg-red-50 text-red-600",
  outline: "bg-transparent text-foreground border border-[rgba(0,0,0,0.1)]",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
