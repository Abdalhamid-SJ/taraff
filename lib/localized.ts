import { useLocale } from "next-intl";

type LocalizedFields<Field extends string> = {
  [K in `${Field}En` | `${Field}Ar`]: string;
};

// §8: dual-column fields (nameEn/nameAr, labelEn/labelAr, ...) — pick the
// active-locale column instead of a translation table.
export function getLocalized<Field extends string>(
  entity: LocalizedFields<Field>,
  field: Field,
  locale: string,
): string {
  const key = (locale === "ar" ? `${field}Ar` : `${field}En`) as keyof LocalizedFields<Field>;
  return entity[key];
}

export function useLocalized<Field extends string>(
  entity: LocalizedFields<Field>,
  field: Field,
): string {
  const locale = useLocale();
  return getLocalized(entity, field, locale);
}
