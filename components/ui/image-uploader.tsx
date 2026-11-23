"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { authed } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
  max = 10,
  multiple = true,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${max} images.`);
      return;
    }
    const picked = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of picked) {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`"${file.name}" is over 2MB and was skipped.`);
          continue;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          toast.error(`"${file.name}" must be JPG, PNG or WebP.`);
          continue;
        }
        const form = new FormData();
        form.append("image", file);
        const json = await authed<{ data: { url: string } }>("/uploads", {
          method: "POST",
          formData: form,
        });
        uploaded.push(json.data.url);
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Uploaded preview" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(value.filter((u) => u !== url))}
                className="absolute top-1 right-1 rounded-full bg-charcoal/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || value.length >= max}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blush-200 bg-blush-50/50 px-4 py-6 text-sm text-charcoal-soft transition-colors hover:border-blush-300 hover:bg-blush-50",
          (uploading || value.length >= max) && "cursor-not-allowed opacity-60",
        )}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-blush-500" />
        ) : (
          <ImagePlus className="size-6 text-blush-400" />
        )}
        {uploading
          ? "Uploading…"
          : value.length >= max
            ? `Maximum ${max} images`
            : `Upload images (${value.length}/${max})`}
      </button>
    </div>
  );
}
