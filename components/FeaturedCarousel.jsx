import PropertyCard from "./PropertyCard";

export default function FeaturedCarousel({ properties = [], featured = {} }) {
  if (!properties.length) return null;
  return (
    <section className="bg-white py-12">
      <div className="mb-6 flex items-center justify-between gap-4 px-6 md:px-[60px]">
        <h2 className="font-poppins text-xl font-medium uppercase tracking-wide text-ink-secondary sm:text-2xl">
          {featured.heading} <strong className="font-bold">{featured.headingHighlight}</strong>
        </h2>
        <a href="/imoveis" className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-ink-secondary hover:text-primary-dark">
          {featured.seeMore || "Ver mais"}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </a>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 md:px-[60px]">
        {properties.map((p) => (
          <PropertyCard key={p.id} p={p} variant="grid" />
        ))}
      </div>
    </section>
  );
}
