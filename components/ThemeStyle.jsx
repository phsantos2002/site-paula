import { hexToChannels } from "@/lib/content";

/** Injeta as cores escolhidas no /admin como CSS variables (canais RGB). */
export default function ThemeStyle({ colors }) {
  const css = `:root{--primary:${hexToChannels(colors.primary)};--primary-hover:${hexToChannels(
    colors.primaryHover
  )};--primary-dark:${hexToChannels(colors.primaryDark)};--primary-badge:${hexToChannels(
    colors.primaryBadge
  )};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
