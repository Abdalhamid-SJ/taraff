import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(
  family: string,
  text: string,
  weight: number,
): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const brand = t("titleDefault").split("—")[0].trim();
  const description = t("description");
  const fontFamily = locale === "ar" ? "Almarai" : "Fraunces";
  const fontData = await loadGoogleFont(fontFamily, `${brand}${description}`, 700);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FBF8F6",
          padding: "0 90px",
          textAlign: "center",
          fontFamily: fontData ? fontFamily : undefined,
        }}
      >
        <div style={{ display: "flex", color: "#5B2B47", fontSize: 66, fontWeight: 700 }}>
          {brand}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            color: "#1F1A24",
            opacity: 0.72,
            fontSize: 30,
            maxWidth: 900,
          }}
        >
          {description}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            width: 120,
            height: 6,
            backgroundColor: "#B08843",
            borderRadius: 3,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: fontFamily, data: fontData, weight: 700 }] : undefined,
    },
  );
}
