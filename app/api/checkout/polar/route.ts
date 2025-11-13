import { Checkout } from "@polar-sh/nextjs";

const successUrl = process.env.POLAR_SUCCESS_URL || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`;
const returnUrl = process.env.POLAR_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/billing`;
const server = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl,
  returnUrl,
  server, // change to 'production' when live
  theme: "dark",
});
