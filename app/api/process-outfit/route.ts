import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateImmediateFeedback, generateDetailedFeedback } from '@/lib/ai-sister';
import { generateShoppingSuggestions, processOutfitImage } from '@/lib/image-processing';

export async function POST(request: NextRequest) {
  try {
    const { messageId, imageUrl, userId } = await request.json();

    if (!messageId || !imageUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user owns this message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate immediate feedback first
    const immediateFeedback = await generateImmediateFeedback(imageUrl);

    // Update message with immediate feedback
    await supabase
      .from('messages')
      .update({ ai_feedback: immediateFeedback })
      .eq('id', messageId);

    // Process image in background (simplified for now - just generate shopping suggestions)
    const shoppingSuggestions = await generateShoppingSuggestions(imageUrl);

    // Generate detailed feedback
    const detailedFeedback = await generateDetailedFeedback(imageUrl);

    // Create a system message with detailed feedback
    const { data: chatData } = await supabase
      .rpc('get_or_create_current_chat', { p_user_id: userId });

    const detailedFeedbackText = `
${detailedFeedback.detailed}

✨ **Style Suggestions:**
${detailedFeedback.suggestions.map(s => `• ${s}`).join('\n')}

💫 **Vibe Check:** ${detailedFeedback.vibeCheck}

${detailedFeedback.encouragement}
    `.trim();

    await supabase
      .from('messages')
      .insert({
        chat_id: chatData,
        user_id: userId,
        content: detailedFeedbackText,
        message_type: 'system',
        shopping_suggestions: shoppingSuggestions
      });

    // Update the original message with shopping suggestions
    await supabase
      .from('messages')
      .update({ 
        shopping_suggestions: shoppingSuggestions,
        ai_feedback: immediateFeedback
      })
      .eq('id', messageId);

    return NextResponse.json({ 
      success: true,
      immediateFeedback,
      detailedFeedback,
      shoppingSuggestions
    });

  } catch (error) {
    console.error('Error processing outfit:', error);
    return NextResponse.json(
      { error: 'Failed to process outfit' },
      { status: 500 }
    );
  }
} 