"use client";

import { useEffect, useState } from "react";

const NAV = [
  { label: "Cadastre seu Imóvel", href: "/#cadastro" },
  { label: "Imóveis", href: "/imoveis" },
  { label: "Sobre", href: "/#sobre" },
];

export default function Header({ brand = {}, contact = {}, nav = [], header = {} }) {
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wa = `https://wa.me/${contact.whatsapp || ""}?text=Ol%C3%A1%20Paula%2C%20gostaria%20de%20falar%20sobre%20um%20im%C3%B3vel`;
  const items = nav.length ? nav : NAV;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[10000] h-[85px] w-full transition-all duration-300 ${
        stuck ? "bg-[rgba(0,0,0,0.5)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-10 bg-header-gradient transition-opacity duration-300 ${
          stuck ? "opacity-0" : "opacity-100"
        }`}
      />

      <div className="flex h-full w-full items-center justify-between gap-4 px-6 md:px-[60px]">
        {/* Logo */}
        <a href="/" className="flex flex-col leading-none text-white">
          <span className="font-poppins text-[22px] font-semibold tracking-wide">
            {brand.name} <span className="text-primary">{brand.nameHighlight}</span>
          </span>
          <span className="text-[10px] font-normal uppercase tracking-[0.22em] text-white/80">
            {brand.tagline}
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-semibold uppercase tracking-wide text-white/90 transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full border border-white bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/15 sm:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.05 2C6.5 2 2 6.5 2 12.05c0 1.77.46 3.45 1.34 4.95L2 22l5.13-1.32a10 10 0 0 0 4.92 1.27c5.55 0 10.05-4.5 10.05-10.05S17.6 2 12.05 2zm0 18.06a8 8 0 0 1-4.07-1.11l-.29-.17-3.04.78.81-2.96-.19-.3a8 8 0 1 1 6.78 3.76z" />
            </svg>
            {header.faleConosco || "Fale Conosco"}
          </a>

          <button
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute left-0 right-0 top-[85px] bg-[rgba(0,0,0,0.92)] px-6 py-4 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col gap-3">
            {items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-base uppercase text-white/90 hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
