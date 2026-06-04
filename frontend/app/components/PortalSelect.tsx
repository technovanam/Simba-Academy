import type { SelectHTMLAttributes } from "react";

type PortalSelectSize = "sm" | "md";

const sizeClass: Record<PortalSelectSize, string> = {
  sm: "portal-select portal-select-sm",
  md: "portal-select portal-select-md w-full",
};

export function PortalSelect({
  size = "md",
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { size?: PortalSelectSize }) {
  return (
    <select className={`${sizeClass[size]} ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
