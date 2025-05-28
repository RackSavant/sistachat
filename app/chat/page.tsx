import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ChatInterface from './chat-interface';
import ChatHistoryButton from './chat-history-button';

export default async function ChatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 particles">
      <div className="w-full mb-8 animate-slide-up">
        <div className="glass hover-lift p-6 rounded-xl backdrop-blur-sm">
          <div className="flex gap-4 items-start justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 animate-glow hover-lift">
                <span className="text-white text-xl animate-wiggle">👗</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text mb-2 animate-shimmer">
                  Welcome to SistaChat! ✨
                </h1>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed animate-fade-in">
                  Your AI fashion sister is here to give you the real talk about your style! Upload your outfit pics and get that honest, encouraging feedback you deserve. No judgment, just love and support! 💕
                </p>
              </div>
            </div>
            <div className="hover-lift">
              <ChatHistoryButton user={user} />
            </div>
          </div>
        </div>
      </div>

      <div className="animate-scale-in">
        <ChatInterface user={user} />
      </div>
    </div>
  );
} 