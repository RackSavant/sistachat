"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { submitSimulatedFriendFeedback } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

interface FeedbackThread {
  id: string;
  contacted_friend_identifier_text: string;
  simulated_friend_reply_text: string | null;
  status: string;
}

interface FeedbackThreadsProps {
  outfitId: string;
  solicitationId: string;
  feedbackStatus: string;
  aggregatedFeedback: string | null;
  derivedScore: string | null;
}

export default function FeedbackThreads({
  outfitId,
  solicitationId,
  feedbackStatus,
  aggregatedFeedback,
  derivedScore,
}: FeedbackThreadsProps) {
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedReplies, setSimulatedReplies] = useState<{
    [key: string]: string;
  }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch feedback threads
  useEffect(() => {
    const fetchThreads = async () => {
      if (!solicitationId) return;

      try {
        const { data, error } = await supabase
          .from("friend_feedback_threads")
          .select("*")
          .eq("solicitation_id", solicitationId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setThreads(data || []);
      } catch (err) {
        console.error("Error fetching threads:", err);
        setError("Failed to load feedback threads");
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [solicitationId, supabase]);

  const handleInputChange = (threadId: string, value: string) => {
    setSimulatedReplies((prev) => ({
      ...prev,
      [threadId]: value,
    }));
  };

  const handleSubmitFeedback = async (threadId: string) => {
    const reply = simulatedReplies[threadId];
    if (!reply) return;

    setSubmitting((prev) => ({ ...prev, [threadId]: true }));
    setError(null);

    try {
      const result = await submitSimulatedFriendFeedback({
        threadId,
        replyText: reply,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state to reflect the change
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, simulated_friend_reply_text: reply, status: "reply_received_simulated" }
            : thread
        )
      );

      // Clear the input
      setSimulatedReplies((prev) => {
        const newState = { ...prev };
        delete newState[threadId];
        return newState;
      });

      // Refresh the page if all threads now have replies
      const allThreadsHaveReplies = threads.every(
        (thread) => thread.id === threadId ? true : thread.simulated_friend_reply_text
      );

      if (allThreadsHaveReplies) {
        router.refresh();
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback"
      );
    } finally {
      setSubmitting((prev) => ({ ...prev, [threadId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Loading feedback...</p>
      </div>
    );
  }

  if (!solicitationId || threads.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-muted-foreground">
          No feedback has been requested yet.
        </p>
      </div>
    );
  }

  // If feedback is complete, show the summary
  if (feedbackStatus === "friend_feedback_complete") {
    return (
      <div className="space-y-6">
        {aggregatedFeedback && (
          <div>
            <h3 className="text-md font-medium mb-2">Friend Feedback Summary</h3>
            <p>{aggregatedFeedback}</p>
          </div>
        )}

        {derivedScore && (
          <div>
            <h3 className="text-md font-medium mb-2">Overall Assessment</h3>
            <p>{derivedScore}</p>
          </div>
        )}

        <div>
          <h3 className="text-md font-medium mb-4">Individual Feedback</h3>
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card key={thread.id}>
                <CardContent className="p-4">
                  <p className="font-medium mb-1">
                    {thread.contacted_friend_identifier_text}
                  </p>
                  <p className="text-sm">{thread.simulated_friend_reply_text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the threads with input for simulation
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground mb-4">
        Feedback has been requested from your friends. For this demo, you can
        simulate their responses below.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-4">
        {threads.map((thread) => (
          <Card key={thread.id}>
            <CardContent className="p-4">
              <p className="font-medium mb-3">
                {thread.contacted_friend_identifier_text}
              </p>

              {thread.simulated_friend_reply_text ? (
                <p className="text-sm">{thread.simulated_friend_reply_text}</p>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter simulated feedback from this friend..."
                    value={simulatedReplies[thread.id] || ""}
                    onChange={(e) =>
                      handleInputChange(thread.id, e.target.value)
                    }
                  />
                  <Button
                    onClick={() => handleSubmitFeedback(thread.id)}
                    disabled={
                      !simulatedReplies[thread.id] || submitting[thread.id]
                    }
                    size="sm"
                  >
                    {submitting[thread.id]
                      ? "Submitting..."
                      : "Submit Simulated Reply"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 