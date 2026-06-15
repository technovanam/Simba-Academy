import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
  useLocation,
} from "react-router";
import { getToken, getUser, clearSession } from "./lib/auth";

import type { Route } from "./+types/root";
import { FormAutofillBlocker } from "./components/FormAutofillBlocker";
import { captureClientError, initMonitoring } from "./lib/monitoring";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#8AC926" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initMonitoring();
  }, []);

  useEffect(() => {
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    const LAST_ACTIVITY_KEY = "simba_last_activity";

    // Set initial activity on mount if logged in
    if (getToken()) {
      if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    }

    function handleActivity() {
      if (getToken()) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    }

    // List of events to listen to
    const events = ["mousedown", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check interval every 10 seconds
    const interval = setInterval(() => {
      const token = getToken();
      if (!token) return;

      const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivityStr) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        return;
      }

      const lastActivity = Number(lastActivityStr);
      const now = Date.now();

      if (now - lastActivity > TIMEOUT_MS) {
        const user = getUser();
        const role = user?.role;

        // Clear session
        clearSession();
        localStorage.removeItem(LAST_ACTIVITY_KEY);

        // Redirect to appropriate login page
        if (role === "ADMIN") {
          navigate("/admin/login?expired=true");
        } else if (role === "TEACHER") {
          navigate("/teacher/login?expired=true");
        } else {
          navigate("/login?expired=true"); // Student
        }
      }
    }, 10000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <>
      <FormAutofillBlocker />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error && error instanceof Error) {
    captureClientError(error);
    if (import.meta.env.DEV) {
      details = error.message;
      stack = error.stack;
    }
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
