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
    <div className="space-y-3 rounded-2xl border-3 border-black bg-white p-5 shadow-none">
      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-3 border-black bg-mustard px-4 py-3 text-lg font-bold text-black shadow-hard-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:brightness-105">
        <Upload className="h-5 w-5" />
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
        <div className="grid grid-cols-3 gap-3">
          {value.map((url) => (
            <div key={url} className="relative overflow-hidden rounded-xl border-3 border-black">
              <img src={url} alt="Product" className="h-24 w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
