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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
      <div className="w-full mb-8">
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border border-pink-200/50 dark:border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex gap-4 items-start justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">👗</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Welcome to SistaChat! ✨
                </h1>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Your AI fashion sister is here to give you the real talk about your style! Upload your outfit pics and get that honest, encouraging feedback you deserve. No judgment, just love and support! 💕
                </p>
              </div>
            </div>
            <ChatHistoryButton user={user} />
          </div>
        </div>
      </div>

      <ChatInterface user={user} />
    </div>
  );
} 