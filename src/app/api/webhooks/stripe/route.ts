import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    if (!stripe) {
        return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

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
                await supabaseAdmin
                    .from("organizations")
                    .update({
                        subscription_tier: "pro",
                        stripe_customer_id: session.customer as string,
                        subscription_status: "active",
                    })
                    .eq("id", orgId);
            }
            break;
        }

        case "customer.subscription.updated": {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;
            const status = subscription.status;

            const tier = status === "active" ? "pro" : "free";

            await supabaseAdmin
                .from("organizations")
                .update({
                    subscription_tier: tier,
                    subscription_status: status,
                })
                .eq("stripe_customer_id", customerId);
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;

            await supabaseAdmin
                .from("organizations")
                .update({
                    subscription_tier: "free",
                    subscription_status: "canceled",
                })
                .eq("stripe_customer_id", customerId);
            break;
        }
    }

    return NextResponse.json({ received: true });
}
