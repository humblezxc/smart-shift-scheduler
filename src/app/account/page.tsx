import { getAccountInfo } from "@/features/account/actions";
import { AccountView } from "@/features/account/components/account-view";

export default async function AccountPage() {
    const { email } = await getAccountInfo();

    return <AccountView email={email} />;
}
