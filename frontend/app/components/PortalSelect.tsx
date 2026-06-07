import type { SelectHTMLAttributes } from "react";

type PortalSelectSize = "sm" | "md";

const sizeClass: Record<PortalSelectSize, string> = {
  sm: "portal-select portal-select-sm",
  md: "portal-select portal-select-md w-full",
};

export function PortalSelect({
  uiSize = "md",
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { uiSize?: PortalSelectSize }) {
  return (
    <select className={`${sizeClass[uiSize]} ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
