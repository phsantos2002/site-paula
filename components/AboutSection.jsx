export default function AboutSection({ about = {}, contact = {} }) {
  const wa = `https://wa.me/${contact.whatsapp || ""}?text=Ol%C3%A1%20Paula%2C%20gostaria%20de%20falar%20sobre%20um%20im%C3%B3vel`;
  const highlights = about.highlights || [];

  return (
    <section id="sobre" className="scroll-mt-[85px] bg-white px-6 py-16 md:px-[60px]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row md:gap-16">
        <div className="relative shrink-0">
          <div className="absolute -bottom-4 -right-4 -z-0 h-full w-full rounded-2xl bg-primary/20" aria-hidden />
          <img
            src={about.photo}
            alt="Paula Regina, corretora de imóveis"
            className="relative z-10 h-[380px] w-[300px] rounded-2xl object-cover object-top shadow-lg md:h-[440px] md:w-[340px]"
          />
        </div>

        <div className="flex flex-col gap-5 text-center md:text-left">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-dark">
            {about.eyebrow}
          </span>
          <h2 className="font-poppins text-3xl font-medium leading-tight text-ink-secondary md:text-4xl">
            {about.title} <strong className="font-bold">{about.titleHighlight}</strong>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-ink-secondary">{about.text}</p>

          <div className="mt-2 flex justify-center gap-8 md:justify-start">
            {highlights.map((h, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-poppins text-3xl font-bold text-primary-dark">{h.value}</div>
                <div className="text-sm text-ink-muted">{h.label}</div>
              </div>
            ))}
          </div>

          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full max-w-cta items-center justify-center gap-2 self-center rounded-pill bg-primary px-3 py-[11px] text-base font-medium text-ink-cta transition-colors hover:bg-primary-hover md:self-start"
          >
            {about.buttonText || "Falar com a Paula"}
          </a>
        </div>
      </div>
    </section>
  );
}
