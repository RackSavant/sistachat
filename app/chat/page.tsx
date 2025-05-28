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
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="flex gap-1 text-foreground/70">
              <span>✨</span>
            </div>
            <span className="text-foreground/70">
              Welcome to sistachat! Upload your outfit pics and get that honest sister feedback you need! 💫
            </span>
          </div>
          <ChatHistoryButton user={user} />
        </div>
      </div>

      <ChatInterface user={user} />
    </div>
  );
} 