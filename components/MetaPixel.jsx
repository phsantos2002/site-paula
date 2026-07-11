"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

// Pixel da Meta (Facebook/Instagram). Só carrega quando há um ID configurado no painel
// (content.tracking.metaPixelId) e nunca no /admin. O código-base já dispara o 1º PageView;
// para navegações internas (SPA) disparamos PageView a cada troca de rota, pulando a inicial
// para não contar o primeiro acesso duas vezes.
export default function MetaPixel({ pixelId }) {
  const pathname = usePathname();
  const firstRun = useRef(true);
  const isAdmin = pathname?.startsWith("/admin");
  const active = !!pixelId && !isAdmin;

  useEffect(() => {
    if (!active) return;
    if (firstRun.current) { firstRun.current = false; return; }
    if (typeof window !== "undefined" && window.fbq) window.fbq("track", "PageView");
  }, [pathname, active]);

  if (!active) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
