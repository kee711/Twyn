import { CustomerPortal } from "@polar-sh/nextjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { createAdminClient } from "@/lib/supabase/admin";

const server = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";
const returnUrl = process.env.POLAR_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/billing`;

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server,
  returnUrl,
  getCustomerId: async () => {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return ""; // helper will 400

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("polar_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    return profile?.polar_customer_id || ""; // helper will 400 if empty
  },
});

