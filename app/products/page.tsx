"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, AlertCircle, Edit3, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import type { ProductProfile } from "@/types/db";

const defaultProduct: ProductForm = {
  id: undefined,
  name: "",
  summary: "",
  audience: "",
  positioning: "",
  benefits: [],
  price: "",
  image_urls: []
};

type ProductForm = {
  id?: string;
  name: string;
  summary: string;
  audience: string;
  positioning: string;
  benefits: string[];
  price: string;
  image_urls: string[];
};

export default function ProductsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [form, setForm] = useState<ProductForm>(defaultProduct);

  const loadProducts = useCallback(
    async (targetUserId?: string) => {
      const resolvedId = targetUserId ?? userId;
      if (!resolvedId) return;
      const { data, error } = await supabase
        .from("product_profiles")
        .select("*")
        .eq("user_id", resolvedId)
        .order("created_at", { ascending: false });
      if (error) {
        setStatus(error.message);
        return;
      }
      setProducts(data ?? []);
    },
    [supabase, userId]
  );

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) {
        setStatus("Please sign in to manage products.");
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      await loadProducts(session.user.id);
      setLoading(false);
    };
    init();
  }, [loadProducts, supabase]);

  const resetForm = () => {
    setForm(defaultProduct);
  };

  const saveProduct = async () => {
    if (!userId) return;
    if (!form.name.trim()) {
      setStatus("Product name is required.");
      return;
    }
    setSaving(true);
    setStatus(null);
    const payload = {
      id: form.id,
      user_id: userId,
      name: form.name,
      summary: form.summary,
      audience: form.audience,
      positioning: form.positioning,
      benefits: form.benefits,
      price: form.price,
      image_urls: form.image_urls
    };
    const { data, error } = await supabase
      .from("product_profiles")
      .upsert(payload)
      .select("*")
      .maybeSingle();
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Product saved.");
      resetForm();
      await loadProducts(userId);
      if (data) {
        setForm((prev) => ({ ...prev, id: undefined }));
      }
    }
    setSaving(false);
  };

  const deleteProduct = async (id: string | undefined) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;
    await supabase.from("product_profiles").delete().eq("id", id);
    await loadProducts();
    if (form.id === id) {
      resetForm();
    }
  };

  const startEdit = (product: ProductProfile) => {
    setForm({
      id: product.id,
      name: product.name,
      summary: product.summary ?? "",
      audience: product.audience ?? "",
      positioning: product.positioning ?? "",
      benefits: product.benefits ?? [],
      price: product.price ?? "",
      image_urls: product.image_urls ?? []
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-tight text-black/50">Products</p>
          <h1 className="text-2xl font-semibold text-ink">Product library</h1>
          <p className="text-sm text-black/60">Store every SKU with positioning, benefits, and images.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-black/70"
        >
          <Plus className="h-4 w-4" />
          New product
        </button>
      </div>

      {status && (
        <div className="flex items-center gap-2 rounded-lg bg-black/5 p-3 text-sm text-black/70">
          <AlertCircle className="h-4 w-4 text-punch" />
          <span>{status}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-black/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading products...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
            <TextareaField
              label="Summary"
              value={form.summary}
              onChange={(v) => setForm((p) => ({ ...p, summary: v }))}
            />
            <TextareaField
              label="Target audience"
              value={form.audience}
              onChange={(v) => setForm((p) => ({ ...p, audience: v }))}
            />
            <TextareaField
              label="Positioning"
              value={form.positioning}
              onChange={(v) => setForm((p) => ({ ...p, positioning: v }))}
            />
            <ChipInput
              label="Benefits / proof points"
              values={form.benefits}
              placeholder="Press Enter to add benefit"
              onChange={(values) => setForm((p) => ({ ...p, benefits: values }))}
            />
            <Field label="Price point" value={form.price} onChange={(v) => setForm((p) => ({ ...p, price: v }))} />
            <ProductImageUploader
              value={form.image_urls}
              onChange={(urls) => setForm((p) => ({ ...p, image_urls: urls }))}
            />
            <button
              type="button"
              onClick={saveProduct}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-punch px-4 py-3 text-sm font-semibold text-white shadow-pill hover:brightness-105 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save product
            </button>
          </div>

          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/20 p-6 text-sm text-black/60">
                No products yet. Save your first product to unlock the ad builder.
              </div>
            ) : (
              products.map((product) => (
                <article key={product.id} className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-tight text-black/40">Product</p>
                      <h3 className="text-lg font-semibold text-ink">{product.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/70"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/70"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-black/70">{product.summary}</p>
                  {product.benefits && product.benefits.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.benefits.map((benefit) => (
                        <span key={benefit} className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/70">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  )}
                  {product.image_urls && product.image_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {product.image_urls.map((url) => (
                        <img key={url} src={url} alt={product.name} className="h-20 w-full rounded-xl object-cover" />
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-ink">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-inner focus:border-punch focus:outline-none"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-ink">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-inner focus:border-punch focus:outline-none min-h-[100px]"
      />
    </label>
  );
}

function ChipInput({
  label,
  values,
  placeholder,
  onChange
}: {
  label: string;
  values: string[];
  placeholder?: string;
  onChange: (values: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const addValue = () => {
    const clean = inputValue.trim();
    if (!clean) return;
    if (values.some((value) => value.toLowerCase() === clean.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...values, clean]);
    setInputValue("");
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, idx) => idx !== index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addValue();
    }
  };

  return (
    <div className="space-y-2 text-sm font-medium text-ink">
      <span className="block">{label}</span>
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-inner space-y-3">
        <div className="flex flex-wrap gap-2">
          {values.length === 0 && <span className="text-xs font-normal text-black/40">No entries yet.</span>}
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-punch/10 px-3 py-1 text-xs font-semibold text-punch border border-punch/20"
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="text-base leading-none text-punch/70 hover:text-punch"
                aria-label={`Remove ${value}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal text-ink focus:border-punch focus:outline-none"
        />
      </div>
    </div>
  );
}
