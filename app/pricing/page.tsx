import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Pricing - Sister Chat",
  description: "Choose the plan that works for you",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's subscription if logged in
  let subscription = null;
  if (user) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();
    subscription = data;
  }

  const isPremium = subscription?.plan_id?.includes("premium");

  return (
    <div className="flex-1 w-full flex flex-col gap-8 py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto w-full text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16">
          Choose the plan that works best for you
        </p>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Free Tier */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Free Tier</h3>
              <div className="mb-4 flex items-baseline justify-center">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Perfect for trying out the service
              </p>
              
              {user ? (
                isPremium ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                )
              ) : (
                <Link href="/sign-up">
                  <Button className="w-full">Sign Up Free</Button>
                </Link>
              )}
            </div>
            
            <div className="border-t border-border">
              <ul className="p-6 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>AI analysis for uploaded outfits</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Basic outfit history</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Up to 3 outfit uploads per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <XIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Friend feedback requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <XIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Aggregated feedback summary</span>
                </li>
                <li className="flex items-start gap-3">
                  <XIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Style trend reports</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="bg-card rounded-lg border-2 border-primary shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
              POPULAR
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Premium Plan</h3>
              <div className="mb-4 flex items-baseline justify-center">
                <span className="text-5xl font-bold">$20</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">
                For fashion enthusiasts seeking feedback
              </p>
              
              {user ? (
                isPremium ? (
                  <Link href="/settings/subscription">
                    <Button className="w-full" variant="outline">
                      Manage Subscription
                    </Button>
                  </Link>
                ) : (
                  <Link href="/api/stripe/create-checkout-session">
                    <Button className="w-full">Upgrade Now</Button>
                  </Link>
                )
              ) : (
                <Link href="/sign-up?plan=premium">
                  <Button className="w-full">Choose Premium</Button>
                </Link>
              )}
            </div>
            
            <div className="border-t border-border">
              <ul className="p-6 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Enhanced AI analysis with detailed suggestions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Complete outfit history and organization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Up to 100 outfit uploads per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Up to 20 friend feedback requests per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Aggregated feedback summary and insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-4xl mx-auto w-full mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="grid gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-muted-foreground">
              Yes, you can cancel your premium subscription at any time. You'll continue to have access to premium features until the end of your current billing cycle.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">How does the friend feedback feature work?</h3>
            <p className="text-muted-foreground">
              With a premium subscription, you can send your outfit photos to your trusted friends for feedback. They'll receive a notification and can provide their opinions, which will be aggregated into a comprehensive summary.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">What happens if I exceed my monthly upload limit?</h3>
            <p className="text-muted-foreground">
              If you reach your monthly upload limit, you'll need to wait until the next billing cycle to upload more outfits, or upgrade to a premium plan for a higher limit.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Is my data private and secure?</h3>
            <p className="text-muted-foreground">
              We take privacy seriously. Your outfit photos are only shared with the friends you explicitly choose to share them with. Our platform uses industry-standard encryption and security practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 