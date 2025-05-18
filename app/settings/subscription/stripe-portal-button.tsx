"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/app/actions";

interface StripePortalButtonProps {
  stripeCustomerId?: string;
}

export default function StripePortalButton({ stripeCustomerId }: StripePortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    if (!stripeCustomerId) {
      setError("No subscription found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { url, error } = await createPortalSession({
        stripeCustomerId,
      });

      if (error) {
        throw new Error(error);
      }

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Error opening Stripe portal:", err);
      setError(
        err instanceof Error ? err.message : "Failed to open customer portal"
      );
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={handleOpenPortal}
        disabled={loading || !stripeCustomerId}
      >
        {loading ? "Opening..." : "Manage Subscription"}
      </Button>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
} 