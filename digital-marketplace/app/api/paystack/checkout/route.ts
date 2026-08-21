import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

// Call this when the buyer clicks "Buy". It creates a pending order server-side
// (so the price comes from the database, never from the client) and returns
// a reference for the frontend to pass into Paystack's popup.
export async function POST(req: NextRequest) {
  const { buyerId, productId, email } = await req.json();

  const admin = supabaseAdmin();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("id, price_kobo, seller_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reference = `dm_${randomUUID()}`;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      buyer_id: buyerId,
      status: "pending",
      total_kobo: product.price_kobo,
      paystack_reference: reference,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  await admin.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    seller_id: product.seller_id,
    price_kobo: product.price_kobo,
  });

  return NextResponse.json({
    reference,
    amountKobo: product.price_kobo,
    email,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  });
}
