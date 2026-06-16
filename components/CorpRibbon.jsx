const ICONS = [
  "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  "M3 21h18M5 21V7l8-4 8 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1",
  "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
];

export default function CorpRibbon({ ribbon = [] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 bg-white px-6 py-5 md:px-[60px]">
      {ribbon.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px] text-ink-secondary">
          <span className="text-primary-dark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[i % ICONS.length]} />
            </svg>
          </span>
          <span>
            {s.pre}
            <strong className="font-bold text-primary-dark"> {s.strong} </strong>
            {s.post}
          </span>
        </div>
      ))}
    </div>
  );
}
