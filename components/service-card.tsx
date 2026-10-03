import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Price } from "@/components/currency-symbol";

export type ServiceCardData = {
  id: string;
  href: string;
  name: string;
  category?: string;
  price: number | null;
  imageUrl: string | null;
};

// Image-led service tile. Used by the home-page carousel and the services grid.
export function ServiceCard({
  service,
  fromLabel,
  className = "",
}: {
  service: ServiceCardData;
  fromLabel: string;
  className?: string;
}) {
  return (
    <Link
      href={service.href}
      draggable={false}
      className={`group/card block rounded-[1.75rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass ${className}`.trim()}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-blush shadow-[var(--shadow-soft)] transition-shadow duration-500 group-hover/card:shadow-[var(--shadow-lift)]">
        {service.imageUrl ? (
          // Admin-uploaded image (see site-header.tsx for why this is a plain <img>).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.imageUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover/card:scale-[1.06]"
          />
        ) : (
          // No photo yet: a tinted tile carrying the service's initial, so the
          // grid keeps its rhythm instead of showing a broken or unrelated image.
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center bg-[radial-gradient(120%_90%_at_20%_10%,white_0%,var(--blush)_45%,color-mix(in_oklab,var(--blush)_70%,var(--mulberry))_100%)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover/card:scale-[1.06]"
          >
            <span className="font-display text-[7rem] leading-none font-semibold text-mulberry/15">
              {service.name.trim().charAt(0)}
            </span>
          </div>
        )}
        <span
          aria-hidden="true"
          className="absolute end-4 top-4 flex size-11 items-center justify-center rounded-full bg-paper/85 text-ink backdrop-blur transition-all duration-300 ease-[var(--ease-out-expo)] group-hover/card:bg-mulberry group-hover/card:text-paper"
        >
          <ArrowUpRight className="size-5 transition-transform duration-300 group-hover/card:rotate-45 rtl:-scale-x-100" />
        </span>
      </div>

      <div className="mt-4 px-1">
        {service.category && <p className="text-sm text-ink/55">{service.category}</p>}
        <h3 className="mt-0.5 font-display text-xl font-semibold text-ink transition-colors duration-200 group-hover/card:text-mulberry">
          {service.name}
        </h3>
        {service.price !== null && (
          <p className="mt-1.5 text-sm text-ink/70">
            {fromLabel} <Price amount={service.price} className="font-semibold text-ink" />
          </p>
        )}
      </div>
    </Link>
  );
}
