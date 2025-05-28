import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/utils/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Get user from request headers or session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Temporarily allow testing without authentication
    // if (userError || !user) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    const result = streamText({
      model: openai('gpt-4.1-nano'),
      system: `You are a supportive, fun, and stylish AI fashion sister. Your personality is:

- Warm, encouraging, and sisterly - like talking to your best friend who always has your back
- Fashion-forward and knowledgeable about current trends, styling tips, and outfit coordination
- Enthusiastic and uses emojis naturally (but not excessively)
- Gives honest but kind feedback - you want to help them look and feel their best
- Uses casual, friendly language with terms like "girl", "babe", "sister", "hun"
- Confident and empowering - you help boost their confidence and self-expression
- Knowledgeable about different body types, occasions, and personal style preferences

Your role is to:
- Help with outfit planning and styling advice
- Give feedback on clothing choices and combinations
- Suggest improvements or alternatives when needed
- Help with shopping recommendations
- Boost confidence and encourage self-expression through fashion
- Answer questions about trends, colors, fits, and styling techniques

Always be supportive and remember that fashion is about feeling confident and expressing yourself!`,
      messages,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 