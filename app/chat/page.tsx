import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import ChatInterface from './chat-interface';
import ChatHistoryButton from './chat-history-button';
import { User } from '@supabase/supabase-js';

// We no longer need this component as ChatInterface now accepts null users
// function AnonymousChatInterface() {
//   return (
//     <ChatInterface user={null} />
//   );
// }

export default async function ChatPage() {
  const supabase = await createClient();

  // Try to get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // We'll allow access to the chat interface regardless of authentication status

  return (
    <div className="flex-1 w-full h-screen flex flex-col particles">
      {/* Chat Header - Fire Design */}
      <div className="w-full glass backdrop-blur-md border-b border-pink-200/30 dark:border-purple-500/20 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-glow hover-lift">
                  <span className="text-white text-xl animate-wiggle">👗</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Your AI Fashion Sister</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 animate-float">
                  Online • Ready to serve looks ✨
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 glass px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Chat</span>
              </div>
              {/* Only show chat history button if user is authenticated */}
              {user && <ChatHistoryButton user={user} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat History & Quick Actions */}
        <div className="hidden lg:flex w-80 glass border-r border-pink-200/30 dark:border-purple-500/20 flex-col animate-fade-in">
          <div className="p-6 border-b border-pink-200/30 dark:border-purple-500/20">
            <h2 className="font-bold text-lg gradient-text mb-4">Quick Actions 🚀</h2>
            <div className="space-y-3">
              {/* Mentra Glasses Integration - New Feature */}
              <button className="w-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 p-3 rounded-lg hover-lift btn-interactive text-left group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-purple-600 text-white text-xs px-2 py-0.5 rounded-bl-md">
                  New
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:animate-pulse">👓</span>
                  <div>
                    <p className="font-medium">Mentra Glasses</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Live outfit feedback</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full glass p-3 rounded-lg hover-lift btn-interactive text-left group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:animate-bounce">📸</span>
                  <div>
                    <p className="font-medium">Upload Outfit</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Get instant feedback</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full glass p-3 rounded-lg hover-lift btn-interactive text-left group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:animate-wiggle">💡</span>
                  <div>
                    <p className="font-medium">Style Tips</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Ask for advice</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full glass p-3 rounded-lg hover-lift btn-interactive text-left group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:animate-pulse">🛍️</span>
                  <div>
                    <p className="font-medium">Shopping Help</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Find similar items</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Recent Chats 💭</h3>
            <div className="space-y-2">
              <div className="glass p-3 rounded-lg hover-lift cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Today's Outfit Check</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
              </div>
              
              <div className="glass p-3 rounded-lg hover-lift cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">💄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Date Night Look</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface user={user} />
        </div>
      </div>
    </div>
  );
} 