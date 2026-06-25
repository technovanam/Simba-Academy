let Sentry: any = {
  captureException: (err: any) => console.error("Sentry not initialized:", err)
};

if (process.env.SENTRY_DSN) {
  import("@sentry/node").then(s => {
    Sentry = s;
    s.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    });
  }).catch(err => console.error("Failed to load Sentry", err));
}

export { Sentry };
