"use client";

import { useState } from "react";

export default function Login({ brand = {} }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (j.ok) window.location.reload();
    else setError(j.error || "Erro ao entrar.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <div className="font-poppins text-2xl font-semibold text-ink">
            {brand.name || "Painel"} {brand.nameHighlight && <span className="text-primary-dark">{brand.nameHighlight}</span>}
          </div>
          <p className="mt-1 text-sm text-ink-muted">Painel de administração</p>
        </div>

        <label className="mb-1 block text-sm font-medium text-ink">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="mb-4 h-12 w-full rounded-lg border border-inputborder px-4 text-sm outline-none focus:border-primary focus:shadow-focus"
          placeholder="Digite a senha"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-ink text-base font-medium text-white transition-colors hover:bg-ink-secondary disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
