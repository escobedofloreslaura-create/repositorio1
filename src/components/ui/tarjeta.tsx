import { cn } from "@/lib/utils";

interface TarjetaProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
}

export function Tarjeta({ children, className, glass = false, padding = "md", hover = false }: TarjetaProps) {
  const paddings = { none: "", sm: "p-3", md: "p-5", lg: "p-7" };

  return (
    <div
      className={cn(
        "rounded-2xl border border-borde transition-all duration-150",
        glass
          ? "glass"
          : "bg-surface shadow-sm",
        paddings[padding],
        hover && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
