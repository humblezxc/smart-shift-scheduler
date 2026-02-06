"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "../actions";

export function LogoutButton() {
    return (
        <form action={logout}>
            <Button variant="ghost" size="sm" type="submit" title="Logout">
                <LogOut className="h-4 w-4" />
            </Button>
        </form>
    );
}
