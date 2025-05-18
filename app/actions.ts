"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

type UploadOutfitParams = {
  userId: string;
  imageUrl: string;
  storagePath: string;
  notes?: string;
};

export async function uploadOutfit({ 
  userId, 
  imageUrl, 
  storagePath, 
  notes 
}: UploadOutfitParams) {
  try {
    const supabase = await createClient();
    
    // Generate a UUID for the outfit
    const outfitId = uuidv4();
    
    // Get current date for month_year_key
    const currentDate = new Date();
    const monthYearKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}`;
    
    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .single();
    
    const isPremium = subscription?.plan_id?.includes('premium');
    const uploadLimit = isPremium ? 100 : 3;
    
    // Get or create usage quota
    const { data: existingQuota } = await supabase
      .from('user_usage_quotas')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year_key', monthYearKey)
      .single();
    
    if (!existingQuota) {
      // Create new quota record
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      await supabase.from('user_usage_quotas').insert({
        user_id: userId,
        month_year_key: monthYearKey,
        images_uploaded_this_period: 0,
        feedback_flows_initiated_this_period: 0,
        period_start_date: periodStart.toISOString(),
        period_end_date: periodEnd.toISOString()
      });
    }
    
    // Check if user has exceeded their upload limit
    if (existingQuota && existingQuota.images_uploaded_this_period >= uploadLimit) {
      return { error: 'Monthly upload limit reached' };
    }
    
    // Insert outfit record
    const { error: outfitError } = await supabase.from('outfits').insert({
      id: outfitId,
      user_id: userId,
      image_url: imageUrl,
      storage_object_path: storagePath,
      notes,
      feedback_status: 'pending_initial_ai'
    });
    
    if (outfitError) {
      throw new Error(`Error creating outfit: ${outfitError.message}`);
    }
    
    // Increment usage count
    await supabase.rpc('increment_uploads', {
      p_user_id: userId,
      p_month_year_key: monthYearKey
    });
    
    // Simulate AI processing
    // In a real implementation, this would probably be a background job
    setTimeout(async () => {
      const aiAnalysis = generateSimulatedAIFeedback();
      
      await supabase
        .from('outfits')
        .update({
          initial_ai_analysis_text: aiAnalysis,
          feedback_status: 'initial_ai_complete',
          updated_at: new Date().toISOString()
        })
        .eq('id', outfitId);
      
      // Revalidate the outfit page to show the updated data
      revalidatePath(`/outfit/${outfitId}`);
    }, 2000);
    
    return { outfitId, error: null };
  } catch (error) {
    console.error('Upload outfit error:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Helper function to generate fake AI feedback
function generateSimulatedAIFeedback() {
  const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'brown', 'gray'];
  const items = ['dress', 'shirt', 'blouse', 'pants', 'jeans', 'skirt', 'jacket', 'coat', 'sweater', 'cardigan'];
  const occasions = ['casual outing', 'formal event', 'office setting', 'dinner date', 'weekend brunch'];
  const accessories = ['necklace', 'scarf', 'belt', 'earrings', 'bracelet', 'watch', 'hat', 'bag', 'shoes'];
  
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomItem = items[Math.floor(Math.random() * items.length)];
  const randomOccasion = occasions[Math.floor(Math.random() * occasions.length)];
  const randomAccessory = accessories[Math.floor(Math.random() * accessories.length)];
  
  return `AI Analysis: This outfit features a ${randomColor} ${randomItem} and seems suitable for a ${randomOccasion}. Consider pairing with a ${randomAccessory} to complete the look.`;
}

// Action to request friend feedback for an outfit
type RequestFeedbackParams = {
  outfitId: string;
};

export async function requestFriendFeedback({ outfitId }: RequestFeedbackParams) {
  try {
    const supabase = await createClient();
    
    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }
    
    // Get outfit details
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', outfitId)
      .single();
    
    if (outfitError || !outfit) {
      return { error: 'Outfit not found' };
    }
    
    // Verify the outfit belongs to the user
    if (outfit.user_id !== user.id) {
      return { error: 'Unauthorized' };
    }
    
    // Check current feedback status
    if (outfit.feedback_status !== 'initial_ai_complete') {
      return { error: 'Cannot request feedback at this stage' };
    }
    
    // Get current date for month_year_key
    const currentDate = new Date();
    const monthYearKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}`;
    
    // Check if user is premium
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', user.id)
      .single();
    
    const isPremium = subscription?.plan_id?.includes('premium');
    if (!isPremium) {
      return { error: 'Premium subscription required for friend feedback' };
    }
    
    // Check if user has exceeded feedback request limit
    const { data: usageQuota } = await supabase
      .from('user_usage_quotas')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year_key', monthYearKey)
      .single();
    
    const feedbackLimit = 20; // Premium users get 20 feedback requests per month
    if (usageQuota && usageQuota.feedback_flows_initiated_this_period >= feedbackLimit) {
      return { error: 'Monthly feedback request limit reached' };
    }
    
    // Create a feedback solicitation
    const solicitationId = uuidv4();
    const { error: solicitationError } = await supabase
      .from('feedback_solicitations')
      .insert({
        id: solicitationId,
        outfit_id: outfitId,
        user_id: user.id,
        status: 'awaiting_replies'
      });
    
    if (solicitationError) {
      throw new Error(`Error creating solicitation: ${solicitationError.message}`);
    }
    
    // Simulate creating 3 friend feedback threads
    const friendNames = ['Friend 1', 'Friend 2', 'Friend 3'];
    for (const friendName of friendNames) {
      await supabase.from('friend_feedback_threads').insert({
        solicitation_id: solicitationId,
        user_id: user.id,
        contacted_friend_identifier_text: `${friendName} (Simulated)`,
        status: 'message_sent_simulated'
      });
    }
    
    // Update outfit status
    await supabase
      .from('outfits')
      .update({
        feedback_status: 'awaiting_friend_feedback',
        updated_at: new Date().toISOString()
      })
      .eq('id', outfitId);
    
    // Increment feedback request count
    await supabase.rpc('increment_feedback_requests', {
      p_user_id: user.id,
      p_month_year_key: monthYearKey
    });
    
    // Revalidate the outfit page
    revalidatePath(`/outfit/${outfitId}`);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Request feedback error:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Action to submit simulated friend feedback
type SubmitFeedbackParams = {
  threadId: string;
  replyText: string;
};

export async function submitSimulatedFriendFeedback({ 
  threadId, 
  replyText 
}: SubmitFeedbackParams) {
  try {
    const supabase = await createClient();
    
    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }
    
    // Get thread details
    const { data: thread, error: threadError } = await supabase
      .from('friend_feedback_threads')
      .select('*, feedback_solicitations!inner(*)')
      .eq('id', threadId)
      .single();
    
    if (threadError || !thread) {
      return { error: 'Thread not found' };
    }
    
    // Verify the thread belongs to the user
    if (thread.user_id !== user.id) {
      return { error: 'Unauthorized' };
    }
    
    // Update the thread with the simulated reply
    const { error: updateError } = await supabase
      .from('friend_feedback_threads')
      .update({
        simulated_friend_reply_text: replyText,
        status: 'reply_received_simulated',
        updated_at: new Date().toISOString()
      })
      .eq('id', threadId);
    
    if (updateError) {
      throw new Error(`Error updating thread: ${updateError.message}`);
    }
    
    // Check if all threads for this solicitation now have replies
    const { data: threads, error: threadsError } = await supabase
      .from('friend_feedback_threads')
      .select('status')
      .eq('solicitation_id', thread.solicitation_id);
    
    if (threadsError) {
      throw new Error(`Error checking threads: ${threadsError.message}`);
    }
    
    const allRepliesReceived = threads.every(t => t.status === 'reply_received_simulated');
    
    if (allRepliesReceived) {
      // Generate aggregated feedback summary
      const { data: repliesData, error: repliesError } = await supabase
        .from('friend_feedback_threads')
        .select('simulated_friend_reply_text')
        .eq('solicitation_id', thread.solicitation_id);
      
      if (repliesError) {
        throw new Error(`Error fetching replies: ${repliesError.message}`);
      }
      
      const replies = (repliesData || []).map(r => r.simulated_friend_reply_text).filter(Boolean);
      const aggregatedFeedback = generateAggregatedFeedback(replies);
      const derivedScore = generateDerivedScore();
      
      // Update the solicitation status
      await supabase
        .from('feedback_solicitations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', thread.solicitation_id);
      
      // Update the outfit with aggregated feedback
      await supabase
        .from('outfits')
        .update({
          aggregated_friend_feedback_summary_text: aggregatedFeedback,
          derived_score_signal_text: derivedScore,
          feedback_status: 'friend_feedback_complete',
          updated_at: new Date().toISOString()
        })
        .eq('id', thread.feedback_solicitations.outfit_id);
      
      // Revalidate the outfit page
      revalidatePath(`/outfit/${thread.feedback_solicitations.outfit_id}`);
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Submit feedback error:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Function to generate a simulated aggregated feedback summary
function generateAggregatedFeedback(replies: string[]) {
  // In a real implementation, this might use AI to summarize the feedback
  // For now, we'll keep it simple
  return `Aggregated Friend Feedback: Your friends have provided their opinions on this outfit. 
          The consensus is generally positive. They particularly like the color combination and style choice. 
          Some suggested adding accessories to enhance the overall look. Based on the collective feedback, 
          this outfit is suitable for the occasion you mentioned.`;
}

// Function to generate a simulated derived score
function generateDerivedScore() {
  const scores = ['Very Good', 'Excellent', 'Good', 'Outstanding'];
  return `Overall Assessment: ${scores[Math.floor(Math.random() * scores.length)]}. 
          This outfit makes a strong impression and suits your style.`;
}

// Stripe portal creation
type CreatePortalSessionParams = {
  stripeCustomerId: string;
};

export async function createPortalSession({ stripeCustomerId }: CreatePortalSessionParams) {
  try {
    const supabase = await createClient();
    
    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }
    
    // For this demo, we won't actually interact with Stripe
    // In a real implementation, this would call the Stripe API
    
    // Simulate a successful portal creation
    return {
      url: `/settings/subscription?success=true&simulation=true`,
      error: null
    };
    
    // Real implementation would be something like:
    /*
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings/subscription`,
    });
    
    return { url: session.url, error: null };
    */
  } catch (error) {
    console.error('Create portal session error:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
