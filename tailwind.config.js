/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === Âmbar (primária / CTA) — dirigido por CSS vars (editável no /admin) ===
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
          dark: "rgb(var(--primary-dark) / <alpha-value>)",
          badge: "rgb(var(--primary-badge) / <alpha-value>)",
        },
        whatsapp: "#4ECB5B",
        // === Texto ===
        ink: {
          DEFAULT: "#212529",   // Texto principal
          secondary: "#323232", // Texto secundário
          muted: "#7A7A7A",     // Texto suave
          cta: "#020200",       // Texto sobre botões âmbar
        },
        // === Superfícies ===
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F5F5",
        },
        separator: "#B2B2B2",
        inputborder: "#BDBDBD",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
      fontSize: {
        hero: ["36.7px", { lineHeight: "44.04px" }],
      },
      borderRadius: {
        pill: "30px",
      },
      maxWidth: {
        cta: "300px",
        buscar: "140px",
      },
      boxShadow: {
        float: "0 4px 12px rgba(0,0,0,0.3)",
        focus: "0 0 0 3px rgb(var(--primary) / 0.2)",
      },
      backgroundImage: {
        "header-gradient":
          "linear-gradient(rgb(0,0,0) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
