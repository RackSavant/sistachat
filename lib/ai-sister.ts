import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SisterFeedback {
  immediate: string;
  detailed: string;
  suggestions: string[];
  encouragement: string;
  vibeCheck: 'fire' | 'cute' | 'chic' | 'casual' | 'bold' | 'sweet';
}

const SISTER_PERSONALITY = `
You are the user's supportive and stylish sister who gives honest but encouraging fashion feedback. 
Your personality is warm, fun, and has that "sister energy" - you're excited to help but also keep it real.

Key traits:
- Use casual, sisterly language with enthusiasm
- Be honest but always constructive and encouraging
- Give specific, actionable suggestions
- Notice details and explain WHY something works or doesn't
- Use phrases like "girl", "babe", "honestly", "I'm obsessed with", "but hear me out"
- Mix compliments with gentle suggestions
- Always end on an encouraging note

Style approach:
- Focus on fit, color coordination, styling opportunities
- Suggest specific pieces that would elevate the look
- Consider the occasion and versatility
- Mention confidence and how the outfit makes them feel
`;

export async function generateImmediateFeedback(imageUrl: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${SISTER_PERSONALITY}

Give a quick, immediate reaction to this outfit (2-3 sentences max). Be enthusiastic and supportive while being honest. This is like the first thing you'd say when your sister shows you her outfit.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What's your immediate reaction to this outfit?"
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || "Girl, you look amazing! I'm loving this whole vibe! ✨";
  } catch (error) {
    console.error('AI feedback generation failed:', error);
    return "Babe, you're serving looks! I'm here for this energy! 💫";
  }
}

export async function generateDetailedFeedback(
  imageUrl: string, 
  context?: string,
  previousMessages?: string[]
): Promise<SisterFeedback> {
  try {
    const contextPrompt = context ? `\n\nContext: ${context}` : '';
    const historyPrompt = previousMessages?.length 
      ? `\n\nPrevious conversation context: ${previousMessages.slice(-3).join('\n')}` 
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${SISTER_PERSONALITY}

Analyze this outfit and provide detailed feedback in the following format:
1. Immediate reaction (enthusiastic but honest)
2. Detailed analysis (what works, what could be improved, styling tips)
3. Specific suggestions (3-4 actionable items)
4. Encouragement (confidence boost and final thoughts)
5. Vibe classification (fire/cute/chic/casual/bold/sweet)

Be specific about colors, fit, styling opportunities, and how to elevate the look.${contextPrompt}${historyPrompt}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Give me your full sister analysis of this outfit!"
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse the response into structured feedback
    // This is a simplified parser - in production you might want more robust parsing
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      immediate: extractSection(lines, 'immediate') || "Girl, you're looking good! ✨",
      detailed: extractSection(lines, 'detailed') || "I love the overall vibe you're going for!",
      suggestions: extractSuggestions(lines) || [
        "Try adding a statement accessory",
        "Consider layering for more dimension",
        "Play with different shoe options"
      ],
      encouragement: extractSection(lines, 'encouragement') || "You've got this, babe! Confidence is your best accessory! 💫",
      vibeCheck: extractVibe(content) || 'cute'
    };
  } catch (error) {
    console.error('Detailed AI feedback generation failed:', error);
    return {
      immediate: "Babe, you're serving looks! I'm here for this energy! 💫",
      detailed: "I love how you put this together! The colors work really well and the fit looks great on you.",
      suggestions: [
        "Try adding a pop of color with accessories",
        "Consider different textures for more visual interest",
        "Play around with layering pieces"
      ],
      encouragement: "You have such great style instincts! Keep experimenting and having fun with fashion! ✨",
      vibeCheck: 'cute'
    };
  }
}

function extractSection(lines: string[], sectionType: string): string | null {
  const sectionIndex = lines.findIndex(line => 
    line.toLowerCase().includes(sectionType.toLowerCase())
  );
  
  if (sectionIndex === -1) return null;
  
  // Get the content after the section header
  const nextSectionIndex = lines.findIndex((line, index) => 
    index > sectionIndex && 
    (line.includes(':') || line.match(/^\d+\./))
  );
  
  const endIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
  
  return lines
    .slice(sectionIndex + 1, endIndex)
    .join(' ')
    .trim();
}

function extractSuggestions(lines: string[]): string[] {
  const suggestions: string[] = [];
  
  for (const line of lines) {
    if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/)) {
      const suggestion = line.replace(/^[-•*\d+\.\s]+/, '').trim();
      if (suggestion) suggestions.push(suggestion);
    }
  }
  
  return suggestions.slice(0, 4); // Limit to 4 suggestions
}

function extractVibe(content: string): SisterFeedback['vibeCheck'] {
  const vibes: SisterFeedback['vibeCheck'][] = ['fire', 'cute', 'chic', 'casual', 'bold', 'sweet'];
  
  for (const vibe of vibes) {
    if (content.toLowerCase().includes(vibe)) {
      return vibe;
    }
  }
  
  return 'cute'; // Default vibe
} 