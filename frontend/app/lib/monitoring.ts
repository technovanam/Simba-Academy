import * as Sentry from "@sentry/react";

let monitoringReady = false;

export function initMonitoring(): void {
  if (monitoringReady || typeof window === "undefined") return;
  monitoringReady = true;

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    });
  }

  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  if (posthogKey) {
    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com",
        capture_pageview: true,
      });
    });
  }
}

export function captureClientError(error: unknown): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error);
  }
}
