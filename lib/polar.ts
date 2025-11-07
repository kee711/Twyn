import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

type AnyObject = Record<string, any>;

function envAny(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v) return v;
  }
  return undefined;
}

function mapPolarProductToPlan(productId?: string): string {
  const proMonthly = envAny("POLAR_PRODUCT_PRO_MONTHLY", "NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY");
  const proYearly = envAny("POLAR_PRODUCT_PRO_YEARLY", "NEXT_PUBLIC_POLAR_PRODUCT_PRO_YEARLY");
  const expertMonthly = envAny(
    "POLAR_PRODUCT_EXPERT_MONTHLY",
    "NEXT_PUBLIC_POLAR_PRODUCT_EXPERT_MONTHLY",
    "POLAR_PRODUCT_TEAM",
    "NEXT_PUBLIC_POLAR_PRODUCT_TEAM"
  );
  const expertYearly = envAny("POLAR_PRODUCT_EXPERT_YEARLY", "NEXT_PUBLIC_POLAR_PRODUCT_EXPERT_YEARLY");

  const map: Record<string, string> = {};
  if (proMonthly) map[proMonthly] = "Pro";
  if (proYearly) map[proYearly] = "Pro";
  if (expertMonthly) map[expertMonthly] = "ProPlus";
  if (expertYearly) map[expertYearly] = "ProPlus";

  return map[productId ?? ""] ?? "Pro";
}

async function findUserProfileByExternalIdOrEmail(externalId?: string, email?: string) {
  if (externalId) {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", externalId)
      .maybeSingle();
    if (data) return data;
  }

  if (email) {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

export async function grantPlanFromPolarPayload(payload: AnyObject) {
  const data = (payload as AnyObject).data ?? payload;
  const customer = data.customer || {};
  const externalId = customer.external_id as string | undefined;
  const email = customer.email as string | undefined;
  const polarCustomerId = customer.id as string | undefined;
  const product = data.product as AnyObject | undefined;

  const userProfile = await findUserProfileByExternalIdOrEmail(externalId, email);
  if (!userProfile) {
    console.warn("polar webhook: no user_profile found for payload", {
      externalId,
      email,
    });
    return;
  }

  const plan_type = mapPolarProductToPlan(product?.id as string | undefined);

  await supabase
    .from("user_profiles")
    .update({
      plan_type,
      polar_customer_id: polarCustomerId ?? null,
    })
    .eq("user_id", userProfile.user_id);
}

export async function revokePlanFromPolarPayload(payload: AnyObject) {
  const data = (payload as AnyObject).data ?? payload;
  const polarCustomerId = data.customer?.id as string | undefined;
  if (!polarCustomerId) return;

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("polar_customer_id", polarCustomerId)
    .maybeSingle();

  if (!userProfile) return;

  await supabase
    .from("user_profiles")
    .update({ plan_type: "Free" })
    .eq("user_id", userProfile.user_id);
}
