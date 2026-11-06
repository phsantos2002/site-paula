import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "pr_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias (segundos)

/**
 * Senha do painel. Em produção é OBRIGATÓRIO definir ADMIN_PASSWORD (sem ela o login
 * fica bloqueado). Em desenvolvimento cai no padrão "paula2026" para facilitar o teste local.
 */
export function adminPassword() {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  return process.env.NODE_ENV === "production" ? null : "paula2026";
}

// Chave que assina o cookie. SESSION_SECRET (opcional) permite derrubar todas as sessões
// sem trocar a senha. Derivada da senha: trocar a senha também invalida as sessões antigas.
function secret() {
  return `${process.env.SESSION_SECRET || ""}::pr-session::${adminPassword() || ""}`;
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(password) {
  const pwd = adminPassword();
  return !!pwd && typeof password === "string" && password.length > 0 && safeEqual(password, pwd);
}

/** Token de sessão: "<expira-em-ms>.<assinatura HMAC>". Não contém a senha e expira sozinho. */
export function sessionToken() {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function isValidToken(token) {
  if (!token || typeof token !== "string" || !adminPassword()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

/** True se o cookie de sessão for válido (assinatura correta e dentro da validade). */
export function isAuthenticated() {
  return isValidToken(cookies().get(COOKIE_NAME)?.value);
}

/* ---- Freio contra tentativa e erro de senha (por IP, em memória da instância) ---- */
const tentativas = new Map(); // ip -> { n, ate }
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 5 * 60 * 1000;

export function loginBloqueado(ip) {
  const t = tentativas.get(ip);
  if (!t) return 0;
  if (t.ate && t.ate > Date.now()) return Math.ceil((t.ate - Date.now()) / 1000);
  if (t.ate && t.ate <= Date.now()) tentativas.delete(ip);
  return 0;
}

export function registrarFalha(ip) {
  const t = tentativas.get(ip) || { n: 0, ate: 0 };
  t.n += 1;
  if (t.n >= MAX_TENTATIVAS) { t.ate = Date.now() + BLOQUEIO_MS; t.n = 0; }
  tentativas.set(ip, t);
  if (tentativas.size > 5000) tentativas.clear(); // não deixa crescer sem limite
}

export function limparFalhas(ip) {
  tentativas.delete(ip);
}
