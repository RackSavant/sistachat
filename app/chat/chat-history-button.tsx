'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistoryButtonProps {
  user: User | null;
}

export default function ChatHistoryButton({ user }: ChatHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const loadChatHistory = async () => {
    setIsLoading(true);
    try {
      // If no user is authenticated, return empty chat history
      if (!user) {
        setChats([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenHistory = () => {
    setIsOpen(true);
    loadChatHistory();
  };

  const createNewChat = async () => {
    try {
      // If no user is authenticated, show a message
      if (!user) {
        alert('Please sign in to create a new chat');
        return;
      }
      
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: 'New Chat'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the page to load the new chat
      window.location.reload();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // If no user is authenticated, don't show chat history button
  if (!user) {
    return null;
  }
  
  if (!isOpen) {
    return (
      <Button
        onClick={handleOpenHistory}
        variant="outline"
        className="flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Chat History
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chat History</CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <div className="space-y-2">
            <Button
              onClick={createNewChat}
              className="w-full justify-start"
              variant="outline"
            >
              + Start New Chat
            </Button>
            
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No previous chats
              </div>
            ) : (
              chats.map((chat) => (
                <Button
                  key={chat.id}
                  onClick={() => {
                    // For now, just reload the page
                    // In the future, you could implement chat switching
                    window.location.reload();
                  }}
                  variant="ghost"
                  className="w-full justify-start text-left"
                >
                  <div>
                    <div className="font-medium">{chat.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(chat.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 