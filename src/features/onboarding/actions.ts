"use server";

import { completeOnboarding } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function finishOnboarding() {
    await completeOnboarding();
    revalidatePath("/");
}
