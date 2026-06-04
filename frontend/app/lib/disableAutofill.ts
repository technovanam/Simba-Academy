const SKIP_TYPES = new Set(["hidden", "submit", "button", "reset", "image", "file"]);

type Fillable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Turn off browser autofill for forms site-wide */
export function disableAutofill(root: ParentNode = document): void {
  root.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
    if (form.dataset.allowAutofill === "true") return;
    form.setAttribute("autocomplete", "off");
  });

  root.querySelectorAll<Fillable>("input, textarea, select").forEach((el) => {
    if (el.dataset.allowAutofill === "true") return;
    if (el.closest('[data-autofill="block"]')) return;
    if ("type" in el && SKIP_TYPES.has((el as HTMLInputElement).type)) return;
    el.setAttribute("autocomplete", "off");
  });
}
