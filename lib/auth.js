import { cookies } from "next/headers";

export const COOKIE_NAME = "pr_admin_session";

function expectedToken() {
  const pwd = process.env.ADMIN_PASSWORD || "paula2026";
  return Buffer.from(`pr::${pwd}`).toString("base64");
}

export function checkPassword(password) {
  const pwd = process.env.ADMIN_PASSWORD || "paula2026";
  return typeof password === "string" && password.length > 0 && password === pwd;
}

export function sessionToken() {
  return expectedToken();
}

/** True se o cookie de sessão for válido. */
export function isAuthenticated() {
  const c = cookies().get(COOKIE_NAME)?.value;
  return !!c && c === expectedToken();
}
