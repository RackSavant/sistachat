import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/utils/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🔵 API Route: POST /api/chat started');
  
  try {
    const body = await req.json();
    console.log('📥 Request body received:', {
      hasMessages: !!body.messages,
      messagesCount: body.messages?.length || 0,
      firstMessage: body.messages?.[0] ? {
        role: body.messages[0].role,
        hasContent: !!body.messages[0].content,
        contentType: typeof body.messages[0].content,
        hasAttachments: !!body.messages[0].experimental_attachments,
        attachmentsCount: body.messages[0].experimental_attachments?.length || 0
      } : null
    });
    
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('❌ Invalid messages format:', messages);
      return new Response('Invalid messages format', { status: 400 });
    }
    
    // Get user from request headers or session
    const supabase = await createClient();
    console.log('🔐 Checking user authentication...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('👤 User auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: userError ? {
        message: userError.message,
        status: userError.status
      } : null
    });
    
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('🔄 Processing messages...');
    
    // Process messages to handle images and ensure proper format
    const processedMessages = messages.map((message: any, index: number) => {
      console.log(`📝 Processing message ${index + 1}:`, {
        role: message.role,
        hasContent: !!message.content,
        contentType: typeof message.content,
        hasAttachments: !!message.experimental_attachments,
        attachmentsCount: message.experimental_attachments?.length || 0,
        hasParts: !!message.parts
      });
      
      // If this is a user message with content
      if (message.role === 'user') {
        // Initialize content array with text if it exists
        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
        
        // Add text content if it exists
        if (message.content) {
          console.log('📄 Adding text content:', message.content);
          content.push({
            type: 'text',
            text: message.content
          });
        } else if (message.parts && Array.isArray(message.parts)) {
          console.log('📄 Processing parts array...');
          // Handle messages with parts array
          message.parts.forEach((part: any, partIndex: number) => {
            console.log(`📄 Processing part ${partIndex + 1}:`, {
              type: part.type,
              hasText: !!part.text
            });
            
            if (part.type === 'text' && part.text) {
              content.push({
                type: 'text',
                text: part.text
              });
            }
          });
        }
        
        // Handle image attachments if they exist
        if (message.experimental_attachments && Array.isArray(message.experimental_attachments)) {
          console.log('🖼️ Processing image attachments...');
          message.experimental_attachments.forEach((attachment: any, attachIndex: number) => {
            console.log(`🖼️ Processing attachment ${attachIndex + 1}:`, {
              name: attachment.name,
              contentType: attachment.contentType,
              url: attachment.url,
              isImage: attachment.contentType?.startsWith('image/')
            });
            
            if (attachment.contentType?.startsWith('image/') && attachment.url) {
              content.push({
                type: 'image_url',
                image_url: { url: attachment.url }
              });
              console.log('✅ Added image to content');
            } else {
              console.warn('⚠️ Skipping non-image attachment:', attachment);
            }
          });
        }
        
        // If no content was added, add a default message
        if (content.length === 0) {
          console.log('📝 No content found, adding default message');
          content.push({
            type: 'text',
            text: 'What do you think of this outfit?'
          });
        }
        
        const processedMessage = {
          ...message,
          content
        };
        
        console.log('✅ Processed user message:', {
          role: processedMessage.role,
          contentItems: processedMessage.content.length,
          contentTypes: processedMessage.content.map((c: any) => c.type)
        });
        
        return processedMessage;
      }
      
      // For non-user messages or messages that don't need processing
      console.log('➡️ Passing through non-user message');
      return message;
    });

    console.log('📤 Final processed messages:', {
      count: processedMessages.length,
      summary: processedMessages.map((msg: any, index: number) => ({
        index: index + 1,
        role: msg.role,
        contentType: typeof msg.content,
        contentItems: Array.isArray(msg.content) ? msg.content.length : 1,
        hasImages: Array.isArray(msg.content) ? msg.content.some((c: any) => c.type === 'image_url') : false
      }))
    });

    console.log('🤖 Calling OpenAI API...');
    
    const result = streamText({
      model: openai('gpt-4o'), // Using gpt-4o for vision capabilities
      system: `You are a supportive, fun, and stylish AI fashion sister. Your personality is:

- Warm, encouraging, and sisterly - like talking to your best friend who always has your back
- Fashion-forward and knowledgeable about current trends, styling tips, and outfit coordination
- Enthusiastic and uses emojis naturally (but not excessively)
- Gives honest but kind feedback - you want to help them look and feel their best
- Uses casual, friendly language with terms like "girl", "babe", "sister", "hun"
- Confident and empowering - you help boost their confidence and self-expression
- Knowledgeable about different body types, occasions, and personal style preferences

When analyzing outfit images:
- Give immediate, enthusiastic reactions
- Notice specific details about fit, color, styling
- Provide constructive suggestions for improvement
- Suggest accessories or styling changes
- Consider the occasion and versatility
- Always be encouraging and confidence-boosting
- Use sisterly language and be specific about what works and what could be elevated

Your role is to:
- Help with outfit planning and styling advice
- Give feedback on clothing choices and combinations
- Suggest improvements or alternatives when needed
- Help with shopping recommendations
- Boost confidence and encourage self-expression through fashion
- Answer questions about trends, colors, fits, and styling techniques

Always be supportive and remember that fashion is about feeling confident and expressing yourself!`,
      messages: processedMessages,
      maxSteps: 5,
      onFinish: (event) => {
        console.log('🎯 OpenAI streaming finished:', {
          text: event.text ? event.text.substring(0, 100) + '...' : 'No text',
          usage: event.usage,
          finishReason: event.finishReason
        });
      },
      onChunk: (event) => {
        console.log('📦 OpenAI chunk received:', {
          chunkType: event.chunk.type,
          value: event.chunk.type === 'text-delta' ? event.chunk.textDelta : event.chunk.type
        });
      },
      onError: (errorEvent) => {
        console.error('🔴 OpenAI API error:', errorEvent.error);
        console.error('🔴 OpenAI error details:', {
          message: errorEvent.error instanceof Error ? errorEvent.error.message : 'Unknown error',
          stack: errorEvent.error instanceof Error ? errorEvent.error.stack : undefined,
          name: errorEvent.error instanceof Error ? errorEvent.error.name : undefined
        });
      }
    });

    console.log('🎯 OpenAI API call initiated, creating stream response...');
    
    const response = result.toDataStreamResponse();
    console.log('✅ Stream response created successfully');
    
    return response;
  } catch (error) {
    console.error('💥 Error in chat API:', error);
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    return new Response('Internal Server Error', { status: 500 });
  }
} 