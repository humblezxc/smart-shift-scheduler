"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function AutoPrint({ auto = true }: { auto?: boolean }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const id = window.setTimeout(() => {
            setReady(true);
            if (auto) {
                try {
                    window.print();
                } catch {
                    /* user can still trigger manually */
                }
            }
        }, 400);
        return () => window.clearTimeout(id);
    }, [auto]);

    return (
        <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2 bg-white shadow-lg rounded-md border p-2">
            <Button size="sm" onClick={() => window.print()} disabled={!ready}>
                <Printer className="w-4 h-4 mr-1.5" />
                Print
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.close()}>
                Close
            </Button>
        </div>
    );
}
