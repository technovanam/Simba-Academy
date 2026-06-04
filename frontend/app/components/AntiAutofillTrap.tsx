import type { FocusEvent } from "react";

/**
 * Hidden decoy inputs — browsers often autofill these instead of real fields.
 * Place as the first child inside a <form>.
 */
export function AntiAutofillTrap() {
  return (
    <div
      className="absolute -left-[9999px] w-px h-px overflow-hidden opacity-0 pointer-events-none"
      aria-hidden="true"
      tabIndex={-1}
    >
      <input type="text" name="prevent_autofill_username" autoComplete="username" tabIndex={-1} defaultValue="" readOnly />
      <input type="password" name="prevent_autofill_password" autoComplete="current-password" tabIndex={-1} defaultValue="" readOnly />
    </div>
  );
}

/** Props that block Chrome/Safari autofill on sensitive fields */
export const blockAutofillInputProps = {
  autoComplete: "one-time-code" as const,
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-bwignore": "true",
  onFocus: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.removeAttribute("readonly");
  },
  readOnly: true,
};
