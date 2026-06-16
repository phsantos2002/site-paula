const ICONS = {
  whatsapp: "M12.05 2C6.5 2 2 6.5 2 12.05c0 1.77.46 3.45 1.34 4.95L2 22l5.13-1.32a10 10 0 0 0 4.92 1.27c5.55 0 10.05-4.5 10.05-10.05S17.6 2 12.05 2zm0 18.06a8 8 0 0 1-4.07-1.11l-.29-.17-3.04.78.81-2.96-.19-.3a8 8 0 1 1 6.78 3.76z",
  instagram: "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.52.01-4.76.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71C3.21 9.1 3.2 9.46 3.2 12s.01 2.9.07 4.14c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.14s-.01-2.9-.07-4.14c-.04-.9-.19-1.39-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32C15.52 4.01 15.15 4 12 4zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28zm5.13-1.04a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z",
  facebook: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z",
};

export default function Footer({ brand = {}, contact = {}, footer = {} }) {
  const socials = [
    { label: "WhatsApp", href: contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "", icon: ICONS.whatsapp },
    { label: "Instagram", href: contact.instagram, icon: ICONS.instagram },
    { label: "Facebook", href: contact.facebook, icon: ICONS.facebook },
  ].filter((s) => s.href);

  const columns = footer.columns || [];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white text-ink">
      <div className="grid gap-10 border-t border-black/10 px-6 py-14 md:grid-cols-[1.3fr_1fr_1fr_1.1fr] md:px-[60px]">
        <div>
          <div className="flex flex-col leading-none">
            <span className="font-poppins text-xl font-semibold">
              {brand.name} <span className="text-primary-dark">{brand.nameHighlight}</span>
            </span>
            <span className="text-[10px] font-normal uppercase tracking-[0.22em] text-ink-muted">{brand.tagline}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-ink-secondary">{footer.aboutText}</p>
          <div className="mt-4 flex gap-3">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-ink-secondary transition-colors hover:bg-primary hover:text-ink-cta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={s.icon} /></svg>
              </a>
            ))}
          </div>
        </div>

        {columns.map((c) => (
          <div key={c.title}>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">{c.title}</h4>
            <ul>
              {(c.links || []).map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"} className="text-sm leading-loose text-ink transition-colors hover:text-primary-dark">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">{footer.attendanceTitle}</h4>
          <p className="text-sm font-semibold text-ink-secondary">{footer.attendanceCity}</p>
          <ul className="mt-1 space-y-1 text-sm text-ink-secondary">
            {footer.attendanceRegion && <li>{footer.attendanceRegion}</li>}
            {contact.phoneDisplay && (
              <li><a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-dark">{contact.phoneDisplay}</a></li>
            )}
            {contact.email && (
              <li><a href={`mailto:${contact.email}`} className="hover:text-primary-dark">{contact.email}</a></li>
            )}
            {contact.creci && <li>CRECI-SP {contact.creci}</li>}
          </ul>
        </div>
      </div>

      <div className="bg-primary px-6 py-4 text-center text-sm text-ink-secondary md:px-[60px]">
        © {year} {brand.name} {brand.nameHighlight}
        {contact.creci ? ` — CRECI-SP ${contact.creci}` : ""} — {brand.tagline}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
