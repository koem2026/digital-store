const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!; // server-side only

// Verifies a transaction directly with Paystack's servers.
// Always call this before marking an order as paid — never trust the
// frontend's "success" callback on its own, since it can be spoofed.
export async function verifyPaystackTransaction(reference: string) {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Paystack verification request failed");
  }

  return {
    success: data.data.status === "success",
    amountKobo: data.data.amount,
    currency: data.data.currency,
    reference: data.data.reference,
    paidAt: data.data.paid_at,
    raw: data.data,
  };
}
