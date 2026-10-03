"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp";
// After a failed upload: is image storage set up at all? Unknown counts as yes,
// so the fallback is the ordinary "try again" message.
async function isStorageConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/blob/upload");
    if (!res.ok) return true;
    const data = (await res.json()) as { configured?: boolean };
    return data.configured !== false;
  } catch {
    return true;
  }
}

const DEFAULT_PREVIEW = "h-24 w-24 rounded-md border border-border object-cover";

export function ImageUpload({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  previewClassName = DEFAULT_PREVIEW,
}: {
  value: string;
  onChange: (url: string) => void;
  // Allowed file types for the picker (the upload route enforces its own list).
  accept?: string;
  previewClassName?: string;
}) {
  const t = useTranslations("AdminServices");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<null | "upload" | "notConfigured">(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      onChange(blob.url);
    } catch {
      setError((await isStorageConfigured()) ? "upload" : "notConfigured");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        // Admin-only thumbnail preview — plain img avoids next/image remote-pattern
        // config for a store hostname that varies per Vercel Blob store.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={previewClassName} />
      )}
      <div className="flex items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-3 text-sm text-ink hover:bg-blush">
          {uploading ? t("uploading") : t("uploadImage")}
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
        {value && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange("")}>
            {t("removeImage")}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(error === "notConfigured" ? "errorUploadNotConfigured" : "errorUpload")}
        </p>
      )}
    </div>
  );
}
