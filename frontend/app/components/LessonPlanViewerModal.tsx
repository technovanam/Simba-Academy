import { useCallback, useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import type { LessonPlan } from "../lib/api";
import { ModalCloseButton } from "./ModalCloseButton";

interface LessonPlanViewerModalProps {
  plan: LessonPlan;
  printOnLoad?: boolean;
  onClose: () => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPrintHtml(plan: LessonPlan): string {
  const planDate = plan.planDate
    ? new Date(plan.planDate).toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const meta = [plan.course?.title, planDate]
    .filter((v): v is string => Boolean(v))
    .map(escapeHtml)
    .join(" · ");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(plan.title)}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 2rem; color: #1e293b; line-height: 1.6; margin: 0; }
      h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
      .meta { font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem; }
      .content { white-space: pre-wrap; font-size: 0.9375rem; }
      .materials { margin-top: 1.5rem; padding: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
      .materials h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 0.5rem; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(plan.title)}</h1>
    ${meta ? `<p class="meta">${meta}</p>` : ""}
    <div class="content">${escapeHtml(plan.content)}</div>
    ${
      plan.materialsNeeded
        ? `<div class="materials"><h2>Materials needed</h2><div class="content">${escapeHtml(plan.materialsNeeded)}</div></div>`
        : ""
    }
  </body>
</html>`;
}

/** Print a lesson plan (call from a click handler for best browser support). */
export function printLessonPlan(plan: LessonPlan): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Lesson plan print");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 500);
  };

  iframe.addEventListener("load", () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      /* print may be blocked */
    }
    cleanup();
  });

  iframe.srcdoc = buildPrintHtml(plan);
}

export function LessonPlanViewerModal({
  plan,
  printOnLoad = false,
  onClose,
}: LessonPlanViewerModalProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const pendingPrintRef = useRef(false);

  const runPrint = useCallback(() => {
    const iframe = printFrameRef.current;
    if (!iframe) return;

    pendingPrintRef.current = true;
    iframe.srcdoc = buildPrintHtml(plan);
  }, [plan]);

  useEffect(() => {
    const iframe = printFrameRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      if (!pendingPrintRef.current) return;
      pendingPrintRef.current = false;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        /* print may be blocked in some browsers */
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!printOnLoad) return;
    runPrint();
  }, [printOnLoad, runPrint]);

  const planDateLabel = plan.planDate
    ? new Date(plan.planDate).toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <iframe
        ref={printFrameRef}
        title="Lesson plan print"
        className="fixed w-0 h-0 border-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Viewing ${plan.title}`}
        onClick={onClose}
      >
        <div
          className="flex flex-col flex-1 min-h-0 max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <h3 className="font-sans font-extrabold text-sm text-slate-900 truncate pr-2">{plan.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={runPrint}
                className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <ModalCloseButton onClick={onClose} />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {plan.course?.title && (
                <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-4xs font-extrabold uppercase border border-violet-200">
                  {plan.course.title}
                </span>
              )}
              {planDateLabel && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-4xs font-extrabold uppercase border border-slate-200">
                  {planDateLabel}
                </span>
              )}
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Lesson plan
              </h4>
              <p className="text-sm text-slate-800 whitespace-pre-wrap font-medium leading-relaxed">
                {plan.content}
              </p>
            </div>

            {plan.materialsNeeded && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Materials needed
                </h4>
                <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium">
                  {plan.materialsNeeded}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
