"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export function ProductImageUploader({ value, onChange }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const nextUrls = [...value];

    for (const file of Array.from(files).slice(0, 3)) {
      const path = `product-${Date.now()}-${file.name}`.replace(/\s+/g, "-").toLowerCase();
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: true
      });
      if (error) {
        console.error("Upload failed", error);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
      if (publicUrl?.publicUrl) {
        nextUrls.push(publicUrl.publicUrl);
      }
    }
    onChange(nextUrls);
    setUploading(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-black/10 bg-white/50 p-4">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-punch px-3 py-2 text-sm font-semibold text-white shadow-pill hover:brightness-105">
        <Upload className="h-4 w-4" />
        <span>{uploading ? "Uploading..." : "Upload product images"}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url) => (
            <img key={url} src={url} alt="Product" className="h-24 w-full rounded-md object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
