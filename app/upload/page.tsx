import { Metadata } from "next";
import UploadForm from "./upload-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Upload Outfit - Sister Chat",
  description: "Upload your outfit to get feedback",
};

export default async function UploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check user's usage quota
  const currentDate = new Date();
  const monthYearKey = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  // Get user's subscription type
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get user's current usage
  const { data: usageQuota } = await supabase
    .from("user_usage_quotas")
    .select("*")
    .eq("user_id", user.id)
    .eq("month_year_key", monthYearKey)
    .single();

  // If no usage record exists, create one
  if (!usageQuota) {
    // This will be handled in the server action
  }

  const isPremium = subscription?.plan_id?.includes("premium");
  const uploadLimit = isPremium ? 100 : 3;
  const currentUsage = usageQuota?.images_uploaded_this_period || 0;
  const isQuotaExceeded = currentUsage >= uploadLimit;

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Upload Your Outfit</h1>

      {isQuotaExceeded ? (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg mb-8">
          <h2 className="font-semibold text-lg mb-2">Upload Limit Reached</h2>
          <p className="mb-4">
            You&apos;ve reached your monthly upload limit of {uploadLimit}{" "}
            outfits.
          </p>
          {!isPremium && (
            <p>
              Upgrade to our Premium Plan to increase your limit to 100 outfits
              per month.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-card border border-border p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-4">
              Upload a photo of your outfit to get AI feedback and (with Premium)
              share with your trusted friends for their opinions.
            </p>
            <div className="flex items-center justify-between py-2 px-4 bg-muted rounded-lg">
              <span className="text-sm">
                Monthly uploads: {currentUsage} / {uploadLimit}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {isPremium ? "Premium" : "Free"}
              </span>
            </div>
          </div>

          <UploadForm userId={user.id} />
        </>
      )}
    </div>
  );
} 