import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// TwiML response helper
function generateTwiMLResponse() {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>', 
    {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await request.formData();
    
    // Extract the relevant fields
    const twilioSignature = request.headers.get('x-twilio-signature') || '';
    const fromNumber = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;
    
    if (!fromNumber || !body) {
      console.error('Invalid webhook data: missing From or Body');
      return generateTwiMLResponse();
    }
    
    // Validate the request is actually from Twilio
    // Convert formData to a plain object for Twilio validation
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const url = new URL(request.url).toString();
    
    if (authToken) {
      const isValid = twilio.validateRequest(
        authToken,
        twilioSignature,
        url,
        params
      );
      
      if (!isValid) {
        console.error('Invalid Twilio signature');
        return new NextResponse('Forbidden', { status: 403 });
      }
    } else {
      console.warn('TWILIO_AUTH_TOKEN not set, skipping signature validation');
    }
    
    // Connect to Supabase
    const supabase = await createClient();
    
    // Find the corresponding solicitation 
    // (we'll look for the most recent non-replied solicitation for this phone number)
    const { data: solicitation, error: fetchError } = await supabase
      .from('sms_feedback_solicitations')
      .select('*')
      .eq('friend_phone_number', fromNumber)
      .eq('status', 'sent')
      .order('solicited_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError) {
      console.error('Error finding solicitation:', fetchError);
      // Still return a valid TwiML response even if we couldn't process the message
      return generateTwiMLResponse();
    }
    
    if (!solicitation) {
      console.log(`No active solicitations found for ${fromNumber}`);
      return generateTwiMLResponse();
    }
    
    // Update the solicitation record
    const { error: updateError } = await supabase
      .from('sms_feedback_solicitations')
      .update({
        friend_reply_text: body,
        status: 'reply_received',
        replied_at: new Date().toISOString()
      })
      .eq('id', solicitation.id);
    
    if (updateError) {
      console.error('Error updating solicitation:', updateError);
    }
    
    // Return TwiML response
    return generateTwiMLResponse();
    
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return generateTwiMLResponse();
  }
} 
 