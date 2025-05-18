"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { requestFriendFeedback } from "@/app/actions";

interface FeedbackRequestButtonProps {
  outfitId: string;
  canRequest: boolean;
}

export default function FeedbackRequestButton({ outfitId, canRequest }: FeedbackRequestButtonProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRequestFeedback = async () => {
    if (!canRequest) return;
    
    setIsRequesting(true);
    setError(null);
    
    try {
      // This is a placeholder for the actual server action
      // that would request feedback from friends
      const result = await requestFriendFeedback({
        outfitId,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Refresh the page to show the pending feedback
      router.refresh();
    } catch (err) {
      console.error("Error requesting feedback:", err);
      setError(err instanceof Error ? err.message : "Failed to request feedback");
    } finally {
      setIsRequesting(false);
    }
  };
  
  if (!canRequest) {
    return (
      <Button disabled variant="outline">
        Request Feedback
      </Button>
    );
  }
  
  return (
    <div>
      <Button 
        onClick={handleRequestFeedback}
        disabled={isRequesting}
      >
        {isRequesting ? "Requesting..." : "Request Feedback"}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
} 