"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("slug", params.id)
      .single()
      .then(({ data }) => setProduct(data));

    // Paystack's inline JS, loaded once
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    document.body.appendChild(script);
  }, [params.id]);

  async function handleBuy() {
    setLoading(true);

    // In production, buyerId/email come from your auth session
    const email = prompt("Enter your email for the receipt:");
    if (!email) {
      setLoading(false);
      return;
    }

    const res = await fetch("/api/paystack/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId: "REPLACE_WITH_AUTH_USER_ID", productId: product.id, email }),
    });
    const { reference, amountKobo, publicKey } = await res.json();

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: amountKobo,
      ref: reference,
      callback: async (response: any) => {
        const verifyRes = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: response.reference }),
        });
        const data = await verifyRes.json();
        if (data.downloads?.[0]) {
          setDownloadUrl(data.downloads[0].url);
        }
        setLoading(false);
      },
      onClose: () => setLoading(false),
    });

    handler.openIframe();
  }

  if (!product) return <p style={{ padding: "2rem" }}>Loading…</p>;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>
        ₦{(product.price_kobo / 100).toLocaleString()}
      </p>

      {product.live_preview_url && (
        <a href={product.live_preview_url} target="_blank">
          View live preview
        </a>
      )}

      {downloadUrl ? (
        <a href={downloadUrl} style={{ display: "block", marginTop: "1rem" }}>
          Payment confirmed — download your file
        </a>
      ) : (
        <button onClick={handleBuy} disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Processing…" : "Buy now"}
        </button>
      )}
    </main>
  );
}
