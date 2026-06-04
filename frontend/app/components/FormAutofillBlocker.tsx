import { useEffect } from "react";
import { useLocation } from "react-router";
import { disableAutofill } from "../lib/disableAutofill";

/** Keeps browser autofill off across the whole site */
export function FormAutofillBlocker() {
  const { pathname } = useLocation();

  useEffect(() => {
    disableAutofill();

    let t: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => disableAutofill(), 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
