import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // For a real implementation, you'd verify the Stripe signature here
    // const signature = req.headers.get("stripe-signature");
    // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // This is a simulated webhook handler, not processing real Stripe events
    
    // In a real implementation, with real Stripe events, the code would be something like:
    /*
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        await req.text(),
        signature!,
        webhookSecret!
      );
    } catch (err) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err}` },
        { status: 400 }
      );
    }
    
    // Get the database client
    const supabase = await createClient();
    
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        
        // Extract customer and subscription IDs
        const { customer, subscription, client_reference_id } = session;
        
        // Verify the user exists
        const { data: userData } = await supabase
          .from("auth.users")
          .select("id")
          .eq("id", client_reference_id)
          .single();
        
        if (!userData) {
          console.error(`User not found: ${client_reference_id}`);
          break;
        }
        
        // Update user metadata with Stripe customer ID
        await supabase.auth.admin.updateUserById(client_reference_id, {
          user_metadata: { stripe_customer_id: customer }
        });
        
        // Get subscription details from Stripe
        const subscriptionData = await stripe.subscriptions.retrieve(subscription);
        
        // Create or update subscription record
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: client_reference_id,
            stripe_subscription_id: subscription,
            plan_id: "premium_monthly", // You'd derive this from the price ID
            status: subscriptionData.status,
            current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscriptionData.cancel_at_period_end
          });
        
        if (subscriptionError) {
          console.error(`Error creating subscription: ${subscriptionError.message}`);
        }
        
        // Create or reset usage quota for the new billing period
        const startDate = new Date(subscriptionData.current_period_start * 1000);
        const endDate = new Date(subscriptionData.current_period_end * 1000);
        const monthYearKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        await supabase.from("user_usage_quotas").upsert({
          user_id: client_reference_id,
          month_year_key: monthYearKey,
          images_uploaded_this_period: 0,
          feedback_flows_initiated_this_period: 0,
          period_start_date: startDate.toISOString(),
          period_end_date: endDate.toISOString()
        });
        
        break;
        
      case "invoice.payment_succeeded":
        // Handle subscription renewals
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscriptionId = invoice.subscription;
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Update subscription record
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();
            
          if (subData) {
            // Update subscription dates
            await supabase
              .from("subscriptions")
              .update({
                status: subscriptionData.status,
                current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString()
              })
              .eq("stripe_subscription_id", subscriptionId);
              
            // Reset usage quotas for the new period
            const startDate = new Date(subscriptionData.current_period_start * 1000);
            const endDate = new Date(subscriptionData.current_period_end * 1000);
            const monthYearKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
            
            await supabase.from("user_usage_quotas").upsert({
              user_id: subData.user_id,
              month_year_key: monthYearKey,
              images_uploaded_this_period: 0,
              feedback_flows_initiated_this_period: 0,
              period_start_date: startDate.toISOString(),
              period_end_date: endDate.toISOString()
            });
          }
        }
        break;
        
      case "customer.subscription.updated":
        // Handle subscription changes
        const updatedSubscription = event.data.object;
        
        await supabase
          .from("subscriptions")
          .update({
            status: updatedSubscription.status,
            plan_id: updatedSubscription.items.data[0].price.id === "premium_price_id" ? "premium_monthly" : "free_tier",
            current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: updatedSubscription.cancel_at_period_end
          })
          .eq("stripe_subscription_id", updatedSubscription.id);
        break;
        
      case "customer.subscription.deleted":
        // Handle subscription cancellation
        const deletedSubscription = event.data.object;
        
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled"
          })
          .eq("stripe_subscription_id", deletedSubscription.id);
        break;
    }
    */
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 