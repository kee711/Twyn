"use client";

export function BuyButton({ userId, email }: { userId: string; email: string }) {
  const productId = "prod_pro_monthly"; // Replace with your Polar product ID
  return (
    <button
      onClick={() => {
        window.location.href = `/api/checkout/polar?products=${productId}&customerExternalId=${userId}&customerEmail=${encodeURIComponent(
          email
        )}`;
      }}
      className="rounded bg-black text-white px-4 py-2"
    >
      Buy Pro
    </button>
  );
}

