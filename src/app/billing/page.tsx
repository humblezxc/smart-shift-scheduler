import { getBillingInfo } from "@/features/billing/actions";
import { BillingView } from "@/features/billing/components/billing-view";

export default async function BillingPage() {
    const billingInfo = await getBillingInfo();

    return <BillingView billingInfo={billingInfo} />;
}
