import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import FeedbackRequestButton from "./feedback-request-button";
import FeedbackThreads from "./feedback-threads";

export const generateMetadata = async ({
  params,
}: {
  params: { outfitId: string };
}): Promise<Metadata> => {
  return {
    title: "Outfit Details - Sister Chat",
    description: "View outfit details and feedback",
  };
};

export default async function OutfitDetailPage({
  params,
}: {
  params: { outfitId: string };
}) {
  const { outfitId } = params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get outfit details
  const { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .select("*")
    .eq("id", outfitId)
    .single();

  if (outfitError || !outfit) {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-6">Outfit Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The outfit you're looking for doesn't exist or you don't have
          permission to view it.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Check user permission (outfit belongs to user)
  if (outfit.user_id !== user.id) {
    return redirect("/dashboard");
  }

  // Get user's subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const isPremium = subscription?.plan_id?.includes("premium");

  // Get feedback solicitation if it exists
  const { data: solicitation } = await supabase
    .from("feedback_solicitations")
    .select("*")
    .eq("outfit_id", outfitId)
    .order("initiated_at", { ascending: false })
    .limit(1)
    .single();

  // Check usage quota for feedback requests
  const currentDate = new Date();
  const monthYearKey = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const { data: usageQuota } = await supabase
    .from("user_usage_quotas")
    .select("*")
    .eq("user_id", user.id)
    .eq("month_year_key", monthYearKey)
    .single();

  const feedbackRequestsUsed = usageQuota?.feedback_flows_initiated_this_period || 0;
  const feedbackRequestsLimit = isPremium ? 20 : 0;
  const canRequestFeedback = isPremium && feedbackRequestsUsed < feedbackRequestsLimit;

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Outfit Details</h1>
          <p className="text-muted-foreground">
            Uploaded on {new Date(outfit.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Outfit Image */}
        <div className="order-1 md:order-1">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outfit.image_url}
              alt="Outfit"
              className="w-full object-cover"
              style={{ maxHeight: "600px" }}
            />
          </div>

          {outfit.notes && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{outfit.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Feedback Section */}
        <div className="order-2 md:order-2 space-y-6">
          {/* AI Feedback */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">AI Feedback</CardTitle>
              <Badge
                variant={
                  outfit.feedback_status === "pending_initial_ai"
                    ? "secondary"
                    : "default"
                }
              >
                {outfit.feedback_status === "pending_initial_ai"
                  ? "Processing"
                  : "Complete"}
              </Badge>
            </CardHeader>
            <CardContent>
              {outfit.feedback_status === "pending_initial_ai" ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-muted-foreground">
                    AI is analyzing your outfit...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>{outfit.initial_ai_analysis_text}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Friend Feedback Section */}
          <Card className={`${!isPremium ? "opacity-60" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Friend Feedback</CardTitle>
              {outfit.feedback_status === "friend_feedback_complete" && (
                <Badge>Complete</Badge>
              )}
              {outfit.feedback_status === "awaiting_friend_feedback" && (
                <Badge variant="secondary">In Progress</Badge>
              )}
            </CardHeader>
            <CardContent>
              {!isPremium ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Upgrade to Premium to get feedback from your trusted friends
                  </p>
                  <Link href="/pricing">
                    <Button variant="outline">Upgrade to Premium</Button>
                  </Link>
                </div>
              ) : outfit.feedback_status === "pending_initial_ai" ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">
                    Wait for AI feedback before requesting friend opinions
                  </p>
                </div>
              ) : outfit.feedback_status === "initial_ai_complete" ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Ready to collect opinions from your trusted friends?
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Monthly feedback requests: {feedbackRequestsUsed} /{" "}
                      {feedbackRequestsLimit}
                    </span>
                    <FeedbackRequestButton
                      outfitId={outfitId}
                      canRequest={canRequestFeedback}
                    />
                  </div>
                </div>
              ) : (
                <FeedbackThreads 
                  outfitId={outfitId} 
                  solicitationId={solicitation?.id}
                  feedbackStatus={outfit.feedback_status}
                  aggregatedFeedback={outfit.aggregated_friend_feedback_summary_text}
                  derivedScore={outfit.derived_score_signal_text}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 