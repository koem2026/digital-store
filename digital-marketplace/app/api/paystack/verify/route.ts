import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { reference } = await req.json();

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // 1. Confirm the payment actually succeeded, straight from Paystack's servers
  const result = await verifyPaystackTransaction(reference);

  if (!result.success) {
    await admin
      .from("orders")
      .update({ status: "failed" })
      .eq("paystack_reference", reference);

    return NextResponse.json({ error: "Payment not successful" }, { status: 402 });
  }

  // 2. Mark the order as paid
  const { data: order, error: orderError } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .select("id, buyer_id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // 3. Pull the items in this order and generate a signed, time-limited
  //    download link for each one — this is the only place download URLs are created
  const { data: items } = await admin
    .from("order_items")
    .select("id, product_id, products(file_path)")
    .eq("order_id", order.id);

  const downloads = [];
  for (const item of items ?? []) {
    const filePath = (item as any).products.file_path;
    const { data: signed } = await admin.storage
      .from("product-files")
      .createSignedUrl(filePath, 60 * 60 * 24); // 24-hour link

    if (signed) {
      const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString();
      await admin.from("downloads").insert({
        order_item_id: item.id,
        buyer_id: order.buyer_id,
        signed_url: signed.signedUrl,
        expires_at: expiresAt,
      });
      downloads.push({ productId: item.product_id, url: signed.signedUrl });
    }
  }

  return NextResponse.json({ status: "paid", downloads });
}
