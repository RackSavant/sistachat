import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import StripePortalButton from "./stripe-portal-button";

export const metadata = {
  title: "Subscription Settings - Sister Chat",
  description: "Manage your subscription and plan settings",
};

export default async function SubscriptionSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get user's usage quotas
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

  const isPremium = subscription?.plan_id?.includes("premium");
  const planLimits = {
    images: isPremium ? 100 : 3,
    feedbackRequests: isPremium ? 20 : 0,
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Subscription Settings</h2>

      <div className="space-y-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription plan and renewal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {isPremium ? "Premium Plan" : "Free Tier"}
                  </h3>
                  {isPremium && subscription?.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {isPremium ? (
                  <StripePortalButton stripeCustomerId={subscription?.stripe_subscription_id} />
                ) : (
                  <Link href="/pricing">
                    <Button>Upgrade to Premium</Button>
                  </Link>
                )}
              </div>

              {isPremium && subscription?.cancel_at_period_end && (
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-md">
                  Your subscription will not renew at the end of your current billing period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your current month's usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Outfit Uploads</span>
                  <span className="text-sm">
                    {usageQuota?.images_uploaded_this_period || 0} /{" "}
                    {planLimits.images}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((usageQuota?.images_uploaded_this_period || 0) /
                          planLimits.images) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Friend Feedback Requests</span>
                  <span className="text-sm">
                    {usageQuota?.feedback_flows_initiated_this_period || 0} /{" "}
                    {planLimits.feedbackRequests}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((usageQuota?.feedback_flows_initiated_this_period || 0) /
                          (planLimits.feedbackRequests || 1)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                {!isPremium && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Upgrade to Premium to access friend feedback features
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Details */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
            <CardDescription>Features included in your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>
                  <strong>AI Analysis:</strong>{" "}
                  {isPremium ? "Enhanced AI analysis with detailed suggestions" : "Basic AI analysis"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>
                  <strong>Uploads:</strong> {planLimits.images} outfit uploads per month
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${
                    isPremium ? "text-primary" : "text-muted-foreground"
                  } flex-shrink-0 mt-0.5`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isPremium ? (
                    <polyline points="20 6 9 17 4 12"></polyline>
                  ) : (
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                  )}
                  {!isPremium && <line x1="6" y1="6" x2="18" y2="18"></line>}
                </svg>
                <span className={!isPremium ? "text-muted-foreground" : ""}>
                  <strong>Friend Feedback:</strong>{" "}
                  {isPremium
                    ? `${planLimits.feedbackRequests} friend feedback requests per month`
                    : "Not included"}
                </span>
              </li>
            </ul>

            {!isPremium && (
              <div className="mt-6">
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">See Premium Benefits</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 