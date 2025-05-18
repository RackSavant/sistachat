import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's outfits
  const { data: outfits, error: outfitsError } = await supabase
    .from("outfits")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch user's subscription info
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch user's usage quotas
  const currentDate = new Date();
  const monthYearKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: usageQuota, error: usageQuotaError } = await supabase
    .from("user_usage_quotas")
    .select("*")
    .eq("user_id", user.id)
    .eq("month_year_key", monthYearKey)
    .single();

  const isPremium = subscription?.plan_id?.includes("premium");
  
  const planLimits = {
    images: isPremium ? 100 : 3,
    feedbackRequests: isPremium ? 20 : 0
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <Link href="/upload">
          <Button size="lg">Upload New Outfit</Button>
        </Link>
      </div>

      {/* Subscription Info */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Your Subscription</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-lg font-medium">
              {subscription?.plan_id ? (
                subscription.plan_id.includes("premium") ? "Premium Plan" : "Free Tier"
              ) : "Free Tier"}
            </p>
            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {subscription.plan_id.includes("premium") && 
                  `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                }
              </p>
            )}
          </div>
          {!isPremium && (
            <Link href="/pricing">
              <Button variant="outline">Upgrade to Premium</Button>
            </Link>
          )}
          {isPremium && (
            <Link href="/settings/subscription">
              <Button variant="outline">Manage Subscription</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Monthly Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Outfits Uploaded</p>
            <div className="flex items-center gap-2">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, ((usageQuota?.images_uploaded_this_period || 0) / planLimits.images) * 100)}%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {usageQuota?.images_uploaded_this_period || 0} / {planLimits.images}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Friend Feedback Requests</p>
            <div className="flex items-center gap-2">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, ((usageQuota?.feedback_flows_initiated_this_period || 0) / (planLimits.feedbackRequests || 1)) * 100)}%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {usageQuota?.feedback_flows_initiated_this_period || 0} / {planLimits.feedbackRequests}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Outfits Gallery */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Outfits</h2>
        {outfitsError && (
          <p className="text-destructive">Error loading outfits</p>
        )}
        
        {outfits?.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <h3 className="text-xl font-medium mb-2">No outfits yet</h3>
            <p className="text-muted-foreground mb-6">Upload your first outfit to get started</p>
            <Link href="/upload">
              <Button>Upload an Outfit</Button>
            </Link>
          </div>
        )}
        
        {outfits && outfits.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit) => (
              <Link 
                href={`/outfit/${outfit.id}`} 
                key={outfit.id}
                className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
              >
                <div className="aspect-square relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={outfit.image_url} 
                    alt="Outfit" 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">
                        {formatDistanceToNow(new Date(outfit.created_at), { addSuffix: true })}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-foreground">
                        {outfit.feedback_status === 'pending_initial_ai' && 'Processing'}
                        {outfit.feedback_status === 'initial_ai_complete' && 'AI Feedback Ready'}
                        {outfit.feedback_status === 'awaiting_friend_feedback' && 'Awaiting Friends'}
                        {outfit.feedback_status === 'friend_feedback_complete' && 'Feedback Complete'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {outfit.notes || 'No description provided'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 