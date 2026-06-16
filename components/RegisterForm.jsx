"use client";

import { useState } from "react";

export default function RegisterForm({ register = {} }) {
  const [sent, setSent] = useState(false);
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree || sending) return;
    setSending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: fd.get("nome"),
      email: fd.get("email"),
      telefone: fd.get("telefone"),
      tipo: fd.get("tipo"),
      mensagem: fd.get("mensagem"),
      website: fd.get("website"), // honeypot
    };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (j.ok) setSent(true);
      else setError(j.error || "Não foi possível enviar. Tente novamente.");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setSending(false);
  };

  return (
    <section id="cadastro" className="relative flex scroll-mt-[85px] flex-col bg-surface-alt md:min-h-[560px] md:flex-row">
      {/* Coluna esquerda: título sobre foto */}
      <div className="relative flex w-full flex-col justify-center overflow-hidden md:w-1/2">
        {register.image && (
          <img src={register.image} alt="Imóvel" className="absolute inset-0 hidden h-full w-full object-cover md:block" />
        )}
        <div className="absolute inset-0 hidden bg-surface-alt/70 md:block" aria-hidden />
        <div className="relative z-10 flex flex-col gap-4 px-6 py-12 md:px-[60px]">
          <h2 className="font-poppins text-3xl font-bold uppercase leading-tight text-ink md:text-4xl">
            {register.headingLine1}
            <br />
            {register.headingLine2}{" "}
            <strong className="font-black text-primary-dark">{register.headingHighlight}</strong>
          </h2>
          <p className="max-w-md text-base text-ink-secondary">{register.description}</p>
        </div>
      </div>

      {/* Coluna direita: card do formulário */}
      <div className="flex w-full items-center justify-center px-6 py-12 md:w-1/2 md:px-[60px]">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          {sent ? (
            <div className="rounded-lg border border-primary bg-primary/10 p-6 text-center">
              <p className="font-poppins text-lg font-semibold text-ink">{register.successTitle}</p>
              <p className="mt-1 text-sm text-ink-secondary">{register.successText}</p>
            </div>
          ) : (
            <>
              <h3 className="font-poppins text-2xl font-semibold text-ink">{register.formTitle}</h3>
              <p className="mb-5 mt-1 text-sm text-ink-muted">{register.formSubtitle}</p>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {/* honeypot anti-spam (oculto) */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                <Input name="nome" placeholder="Nome *" required />
                <Input name="email" type="email" placeholder="E-mail *" required />
                <Input name="telefone" type="tel" placeholder="Telefone / WhatsApp *" required />
                <select
                  name="tipo"
                  required
                  defaultValue=""
                  className="h-14 w-full rounded-lg border border-inputborder bg-white px-5 font-poppins text-xs text-ink-muted outline-none transition-colors focus:border-primary focus:shadow-focus"
                >
                  <option value="" disabled>Tipo de imóvel *</option>
                  <option>Apartamento</option>
                  <option>Casa</option>
                  <option>Terreno</option>
                  <option>Comercial</option>
                </select>
                <textarea
                  name="mensagem"
                  placeholder="Mensagem (opcional)"
                  rows={3}
                  className="w-full rounded-lg border border-inputborder bg-white px-5 py-3 font-poppins text-xs text-ink-muted outline-none transition-colors placeholder:text-inputborder focus:border-primary focus:shadow-focus"
                />

                <label className="flex items-start gap-2 text-xs text-ink-secondary">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                  <span>{register.termsText}</span>
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={!agree || sending}
                  className="self-start rounded bg-ink px-8 py-3 text-base font-medium text-white transition-colors hover:bg-ink-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Enviando..." : register.submitText || "Enviar"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="h-14 w-full rounded-lg border border-inputborder bg-white px-5 font-poppins text-xs text-ink-muted outline-none transition-colors placeholder:text-inputborder focus:border-primary focus:shadow-focus"
    />
  );
}
