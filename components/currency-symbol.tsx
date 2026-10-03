import { useTranslations } from "next-intl";

// The Saudi Riyal sign, traced from the artwork supplied for this project.
// Drawn as an inline SVG path rather than a Unicode character so it renders
// identically on every device regardless of installed fonts, and inherits the
// surrounding text colour via `currentColor`.
const SAUDI_RIYAL_PATH =
  "M67.9 62 66.8 61.6 42.5 66.8 41 70.1 40 75.1 40.9 75.5 52.9 72.6 65.5 70.2Z M47.6 4 43.8 6.6 40 10.6 40 34.1 39.1 34.9 33.8 35.8 32.8 36.4 31.9 35.8 31.8 0.1 31.2 0 28.6 1.9 24.1 6.2 23.9 37.8 23.2 38.4 6.4 41.8 5.4 43.4 4 48.1 4 50 4.9 50.4 15.8 47.8 23.6 46.5 24 47 24 56.1 23.1 56.9 2.5 61 0.8 65.2 0 68.4 0.2 69.6 22 65.2 25.4 63.9 27.1 62.1 31.5 54.9 31.9 53.8 31.9 45 32.6 44.2 39 42.8 40 43.4 40 58.8 40.4 59.2 63.2 54.4 65.8 53.4 67.9 46.2 67.5 45.2 49.9 48.8 48.8 49.4 47.9 48.8 47.9 41.8 48.4 40.9 65.6 37.2 66.8 34.8 67.8 29.2 67.1 28.9 53.4 31.8 51 32.6 48.1 32.8Z";

export function CurrencySymbol({ className = "" }: { className?: string }) {
  const t = useTranslations("Common");
  return (
    <svg
      viewBox="0 0 67.9 75.5"
      fill="currentColor"
      role="img"
      aria-label={t("currencyName")}
      className={`inline-block h-[0.85em] w-auto align-[-0.1em] ${className}`.trim()}
    >
      <path d={SAUDI_RIYAL_PATH} />
    </svg>
  );
}

// An amount followed by the riyal sign, kept on one line so the number and the
// symbol never wrap apart.
export function Price({ amount, className = "" }: { amount: number | string; className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`.trim()}>
      {amount} <CurrencySymbol />
    </span>
  );
}
