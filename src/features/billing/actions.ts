"use server";

import { stripe, SubscriptionTier } from "@/lib/stripe";
import { createSupabaseServerClient, requireOrganization } from "@/lib/supabase-server";

export async function getBillingInfo() {
    const userOrg = await requireOrganization();
    const supabase = await createSupabaseServerClient();

    const { data: org } = await supabase
        .from("organizations")
        .select("subscription_tier, subscription_status, stripe_customer_id")
        .eq("id", userOrg.organization_id)
        .single();

    const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userOrg.organization_id);

    return {
        tier: (org?.subscription_tier || "free") as SubscriptionTier,
        status: org?.subscription_status || "none",
        hasStripe: !!org?.stripe_customer_id,
        employeeCount: employeeCount || 0,
        organizationId: userOrg.organization_id,
        stripeConfigured: !!stripe,
    };
}

export async function createCheckoutSession() {
    if (!stripe) {
        return { error: "Stripe not configured" };
    }

    const userOrg = await requireOrganization();

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
        return { error: "Stripe price not configured" };
    }

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
        metadata: {
            organization_id: userOrg.organization_id,
        },
    });

    return { url: session.url };
}

export async function createPortalSession() {
    if (!stripe) {
        return { error: "Stripe not configured" };
    }

    const userOrg = await requireOrganization();
    const supabase = await createSupabaseServerClient();

    const { data: org } = await supabase
        .from("organizations")
        .select("stripe_customer_id")
        .eq("id", userOrg.organization_id)
        .single();

    if (!org?.stripe_customer_id) {
        return { error: "No billing account found" };
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: org.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return { url: session.url };
}
