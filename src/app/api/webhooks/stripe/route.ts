import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    if (!stripe) {
        return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Supabase service role not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const orgId = session.metadata?.organization_id;
            if (orgId) {
                const { error, count } = await supabaseAdmin
                    .from("organizations")
                    .update({
                        subscription_tier: "pro",
                        stripe_customer_id: session.customer as string,
                        subscription_status: "active",
                    }, { count: "exact" })
                    .eq("id", orgId);
                if (error || !count) {
                    return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
                }
            }
            break;
        }

        case "customer.subscription.updated": {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;
            const status = subscription.status;

            const tier = status === "active" ? "pro" : "free";

            const { error, count } = await supabaseAdmin
                .from("organizations")
                .update({
                    subscription_tier: tier,
                    subscription_status: status,
                }, { count: "exact" })
                .eq("stripe_customer_id", customerId);
            if (error || !count) {
                return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
            }
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;

            const { error, count } = await supabaseAdmin
                .from("organizations")
                .update({
                    subscription_tier: "free",
                    subscription_status: "canceled",
                }, { count: "exact" })
                .eq("stripe_customer_id", customerId);
            if (error || !count) {
                return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
