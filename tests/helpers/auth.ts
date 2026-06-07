import type { Page } from "@playwright/test";
import { API_URL } from "./config";

export interface LoginResult {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export async function apiLogin(
  email: string,
  password: string,
  portal?: "student" | "teacher" | "admin"
): Promise<LoginResult | null> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, ...(portal ? { portal } : {}) }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { token: string; user: LoginResult["user"] };
  return { token: data.token, user: data.user };
}

export async function injectSession(page: Page, session: LoginResult) {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("simba_token", token);
      localStorage.setItem("simba_user", JSON.stringify(user));
    },
    { token: session.token, user: session.user }
  );
}
