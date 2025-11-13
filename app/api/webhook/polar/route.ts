import { Webhooks } from "@polar-sh/nextjs";
import { grantPlanFromPolarPayload, revokePlanFromPolarPayload } from "@/lib/polar";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onOrderPaid: async (payload) => await grantPlanFromPolarPayload(payload),
  onSubscriptionActive: async (payload) => await grantPlanFromPolarPayload(payload),
  onSubscriptionCanceled: async (payload) => await revokePlanFromPolarPayload(payload),
  // Additional events to keep plan state in sync
  onOrderRefunded: async (payload) => await revokePlanFromPolarPayload(payload),
  onSubscriptionUncanceled: async (payload) => await grantPlanFromPolarPayload(payload),
  onSubscriptionUpdated: async (payload) => await grantPlanFromPolarPayload(payload),
  onSubscriptionRevoked: async (payload) => await revokePlanFromPolarPayload(payload),
});
