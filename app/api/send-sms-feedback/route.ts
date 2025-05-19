import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { outfitId, phoneNumbers } = body;

    if (!outfitId || !phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. outfitId and phoneNumbers array are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user's quota for feedback requests
    const currentDate = new Date();
    const monthYearKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}`;

    // Get user subscription to determine limit
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .single();

    const isPremium = subscription?.plan_id?.includes('premium') && 
                     subscription?.status === 'active';
    const feedbackFlowsLimit = isPremium ? 50 : 0;

    // Get current usage
    let { data: usageQuota, error: usageError } = await supabase
      .from('user_usage_quotas')
      .select('feedback_flows_initiated_count')
      .eq('user_id', user.id)
      .eq('month_year_key', monthYearKey)
      .single();

    // If no usage record exists, create one
    if (usageError && usageError.code === 'PGRST116') {
      const { data: newUsage, error: createError } = await supabase
        .from('user_usage_quotas')
        .insert({
          user_id: user.id,
          month_year_key: monthYearKey,
          images_uploaded_count: 0,
          feedback_flows_initiated_count: 0
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create usage quota record' },
          { status: 500 }
        );
      }

      usageQuota = newUsage;
    } else if (usageError) {
      return NextResponse.json(
        { error: 'Failed to check usage quota' },
        { status: 500 }
      );
    }

    const currentUsage = usageQuota?.feedback_flows_initiated_count || 0;

    // Check if user has exceeded their quota
    if (currentUsage >= feedbackFlowsLimit) {
      return NextResponse.json(
        { 
          error: 'You have exceeded your monthly feedback request limit',
          currentUsage,
          limit: feedbackFlowsLimit
        },
        { status: 403 }
      );
    }

    // Fetch the outfit details
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', outfitId)
      .eq('user_id', user.id)
      .single();

    if (outfitError || !outfit) {
      return NextResponse.json(
        { error: 'Outfit not found or you do not have access to it' },
        { status: 404 }
      );
    }

    // Get user profile for the message
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || 'Your friend';

    // Create public URL for the image (ensure it's publicly accessible)
    const imageUrl = outfit.image_url;
    
    // Generate a view page URL (for recipients to view the outfit)
    const viewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/view/outfit/${outfitId}`;
    
    // Track successful sends
    const successfulSends = [];
    const failedSends = [];

    // Send SMS to each phone number
    for (const phoneNumber of phoneNumbers) {
      try {
        // Construct the SMS message
        const messageBody = `Hi! ${userName} via Sister Chat would love your opinion on this outfit: ${viewUrl}\n\nWhat do you think? Reply to this SMS with your feedback.`;

        // Send the SMS via Twilio
        const message = await twilioClient.messages.create({
          body: messageBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });

        // Record the solicitation in the database
        const { data: solicitation, error: solicitationError } = await supabase
          .from('sms_feedback_solicitations')
          .insert({
            outfit_id: outfitId,
            user_id: user.id,
            friend_phone_number: phoneNumber,
            message_sid: message.sid,
            status: 'sent',
            solicited_at: new Date().toISOString()
          })
          .select()
          .single();

        if (solicitationError) {
          console.error('Error recording solicitation:', solicitationError);
          failedSends.push({ phoneNumber, error: 'Database error recording solicitation' });
        } else {
          successfulSends.push({ phoneNumber, solicitation_id: solicitation.id });
        }
      } catch (error) {
        console.error(`Error sending SMS to ${phoneNumber}:`, error);
        failedSends.push({ 
          phoneNumber, 
          error: error instanceof Error ? error.message : 'Unknown error sending SMS' 
        });
      }
    }

    // If at least one message was sent successfully
    if (successfulSends.length > 0) {
      // Update the outfit status
      await supabase
        .from('outfits')
        .update({ feedback_status: 'awaiting_friend_feedback' })
        .eq('id', outfitId);

      // Increment the user's usage quota
      await supabase
        .from('user_usage_quotas')
        .update({ 
          feedback_flows_initiated_count: currentUsage + 1 
        })
        .eq('user_id', user.id)
        .eq('month_year_key', monthYearKey);
    }

    // Return the results
    return NextResponse.json({
      success: true,
      sent: successfulSends.length,
      failed: failedSends.length,
      details: {
        successful: successfulSends,
        failed: failedSends
      }
    });

  } catch (error) {
    console.error('Error in send-sms-feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 