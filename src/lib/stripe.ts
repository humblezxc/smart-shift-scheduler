import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" })
    : null;

export type SubscriptionTier = "free" | "pro" | "business";

export const TIER_LIMITS: Record<SubscriptionTier, { maxEmployees: number }> = {
    free: { maxEmployees: 5 },
    pro: { maxEmployees: 999 },
    business: { maxEmployees: 999 },
};

export function canAddEmployee(tier: SubscriptionTier, currentCount: number): boolean {
    return currentCount < TIER_LIMITS[tier].maxEmployees;
}
