"use client";

import { Button } from "@/components/ui/button";

export default function BillingPage() {
    return (
        <div className="max-w-lg space-y-4">
            <h1 className="text-2xl font-semibold">Billing</h1>
            <p>Your current plan: <strong>Free</strong></p>
            <p>No payment method on file.</p>
            <Button>Upgrade to Premium</Button>
        </div>
    );
}