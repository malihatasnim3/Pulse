"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, AlertCircle, Edit3, Plus, Trash2, Package } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import type { ProductProfile } from "@/types/db";
import { m } from "framer-motion";

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
    const { data, error } = await supabase.from("product_profiles").upsert(payload).select("*").maybeSingle();
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
    <div className="mx-auto max-w-7xl space-y-10 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-black text-ink tracking-tight">Product Library</h1>
        <p className="mt-3 text-xl font-bold text-black/60">
          Manage every product with positioning, benefits, and visuals.
        </p>
      </div>

      {status && (
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-punch border-3 border-black" />
          <div className="relative flex items-center gap-3 rounded-3xl border-3 border-black bg-white p-5">
            <AlertCircle className="h-5 w-5 text-punch" />
            <span className="font-bold text-ink">{status}</span>
          </div>
        </m.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-lg font-bold text-black/60">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading products...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProduct();
            }}
            className="relative lg:col-span-3"
          >
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] bg-cream border-3 border-black" />

            <div className="relative space-y-6 rounded-[2.5rem] border-3 border-black bg-white p-8">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-ink">{form.id ? "Edit Product" : "New Product"}</p>
                {form.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-full border-3 border-black bg-white px-4 py-2 text-sm font-bold text-ink shadow-hard-sm hover:-translate-y-1 transition-transform"
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </button>
                )}
              </div>

              <Field label="Product name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
              <TextArea label="Summary" value={form.summary} onChange={(v) => setForm((p) => ({ ...p, summary: v }))} />
              <TextArea
                label="Target audience"
                value={form.audience}
                onChange={(v) => setForm((p) => ({ ...p, audience: v }))}
              />
              <TextArea
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

              <m.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                {saving ? "Saving..." : "Save Product"}
              </m.button>
            </div>
          </form>

          {/* Products List */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-ink" />
              <p className="text-xl font-black text-ink">Your Products ({products.length})</p>
            </div>

            {products.length === 0 ? (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
              >
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-black border-3 border-black" />
                <div className="relative rounded-3xl border-3 border-black bg-mustard p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-ink/40" />
                  <p className="mt-3 text-xl font-black text-ink">No products yet</p>
                  <p className="mt-2 text-base font-medium text-black/70">
                    Add your first product to unlock the Ad Builder.
                  </p>
                </div>
              </m.div>
            ) : (
              <div className="space-y-4 max-h-[800px] overflow-y-auto">
                {products.map((product, index) => (
                  <m.div
                    key={product.id}
                    className="relative group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-forest border-3 border-black transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                    <div className="relative rounded-3xl border-3 border-black bg-white p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-wide text-black/40">Product</p>
                          <h3 className="text-xl font-black text-ink mt-1">{product.name}</h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-mustard transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-bold text-punch hover:bg-punch hover:text-white transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {product.summary && <p className="text-sm font-medium text-black/70 mb-3">{product.summary}</p>}

                      {product.price && (
                        <div className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-cream px-3 py-1 text-sm font-bold mb-3">
                          {product.price}
                        </div>
                      )}

                      {product.benefits && product.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {product.benefits.map((benefit, idx) => (
                            <span
                              key={idx}
                              className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      )}

                      {product.image_urls && product.image_urls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {product.image_urls.slice(0, 3).map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={product.name}
                              className="h-20 w-full rounded-xl border-2 border-black object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </m.div>
                ))}
              </div>
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
    <label className="block space-y-2 text-base font-bold text-ink">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-2 text-base font-bold text-ink">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="input-field min-h-[100px]" rows={3} />
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
    <div className="space-y-2 text-base font-bold text-ink">
      <span className="block">{label}</span>
      <div className="rounded-2xl border-3 border-black bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {values.length === 0 && <span className="text-sm font-medium text-black/40">No entries yet.</span>}
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-forest px-3 py-1 text-sm font-bold text-white border-2 border-black"
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="text-lg leading-none text-white/80 hover:text-white"
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
          className="w-full rounded-xl border-3 border-black bg-white px-4 py-3 text-base font-bold text-ink focus:outline-none focus:ring-4 focus:ring-mustard/30"
        />
      </div>
    </div>
  );
}
