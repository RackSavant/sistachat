'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Send, Image as ImageIcon, Sparkles, ShoppingBag, Heart } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  image_url?: string;
  processed_image_url?: string;
  ai_feedback?: string;
  shopping_suggestions?: any[];
  created_at: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      // Get or create current chat
      const { data: chatData, error: chatError } = await supabase
        .rpc('get_or_create_current_chat', { p_user_id: user.id });

      if (chatError) throw chatError;

      // Load messages for this chat
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatData)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const formattedMessages: Message[] = messagesData.map(msg => ({
        ...msg,
        isUser: msg.message_type !== 'system'
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      await sendTextMessage(inputText);
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextMessage = async (content: string) => {
    // Get current chat
    const { data: chatId } = await supabase
      .rpc('get_or_create_current_chat', { p_user_id: user.id });

    // Add user message
    const { data: messageData, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        content,
        message_type: 'text'
      })
      .select()
      .single();

    if (error) throw error;

    const userMessage: Message = {
      ...messageData,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);

    // Generate AI response
    const aiResponse = await generateAIResponse(content);
    
    const { data: aiMessageData, error: aiError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        content: aiResponse,
        message_type: 'system'
      })
      .select()
      .single();

    if (aiError) throw aiError;

    const aiMessage: Message = {
      ...aiMessageData,
      isUser: false
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // More sisterly AI responses
    const responses = [
      "Girl, I love that you're thinking about your style! Tell me more about what you're going for! ✨",
      "Ooh babe, I'm so excited to help! Do you have any outfit pics to show me? I'm ready to give you the real tea! 📸💅",
      "Honestly, you know I'm always here for the fashion chat! What's on your mind, sister? 💫",
      "I'm literally obsessed with helping you put together amazing looks! Spill - what are we working with? 👗✨",
      "Girl yes! I live for these style conversations! Drop that fit pic or tell me what vibe you're going for! 🔥",
      "Babe, you came to the right place! Your AI sister is here and ready to help you serve LOOKS! What's the situation? 💕"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsLoading(true);
    try {
      // Upload to Supabase storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('raw-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('raw-images')
        .getPublicUrl(fileName);

      // Get current chat
      const { data: chatId } = await supabase
        .rpc('get_or_create_current_chat', { p_user_id: user.id });

      // Create image message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          content: 'Uploaded an outfit photo',
          message_type: 'image',
          image_url: publicUrl,
          raw_image_url: publicUrl
        })
        .select()
        .single();

      if (messageError) throw messageError;

      const imageMessage: Message = {
        ...messageData,
        isUser: true
      };

      setMessages(prev => [...prev, imageMessage]);

      // Process image and generate feedback in background
      processImageAndGenerateFeedback(messageData.id, publicUrl);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processImageAndGenerateFeedback = async (messageId: string, imageUrl: string) => {
    try {
      // Call our API to process the image and generate feedback
      const response = await fetch('/api/process-outfit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          imageUrl,
          userId: user.id
        }),
      });

      if (!response.ok) throw new Error('Failed to process image');

      // Reload messages to show the updated feedback
      loadMessages();
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto w-full bg-gradient-to-b from-pink-50/30 to-purple-50/30 dark:from-pink-900/10 dark:to-purple-900/10 rounded-xl border border-pink-200/50 dark:border-purple-500/20 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-lg">👗</span>
        </div>
        <div>
          <h2 className="font-semibold">Your AI Fashion Sister</h2>
          <p className="text-sm opacity-90">Always here to keep it 💯 about your style</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨👗💅</div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Hey babe! Ready for some real talk?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              Drop your outfit pics or just start chatting about your style goals! Your AI sister is here to help you serve looks ✨
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <ImageIcon className="w-4 h-4" />
                Upload Your Fit 📸
              </Button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-pink-200/50 dark:border-purple-500/20 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div
          className={`relative ${dragActive ? 'bg-pink-100/50 dark:bg-pink-900/20 border-2 border-dashed border-pink-400' : ''} rounded-lg`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tell me about your outfit or style goals, babe... ✨"
                className="min-h-[60px] resize-none border-pink-200 dark:border-purple-500/30 focus:border-pink-400 dark:focus:border-purple-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="icon"
                disabled={isLoading}
                className="border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-900/20"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                size="icon"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-pink-100/80 dark:bg-pink-900/40 rounded-lg">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                <p className="font-medium text-pink-700 dark:text-pink-300">Drop your outfit pic here, girl! 📸</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${message.isUser ? 'order-2' : 'order-1'}`}>
        {!message.isUser && (
          <div className="flex items-center gap-2 mb-2 ml-2">
            <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">👗</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Your AI Sister</span>
          </div>
        )}
        
        <Card className={`${
          message.isUser 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none' 
            : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-pink-200/50 dark:border-purple-500/20'
        } shadow-sm`}>
          <CardContent className="p-4">
            {message.message_type === 'image' && message.image_url && (
              <div className="mb-3">
                <div className="relative w-full max-w-sm mx-auto">
                  <Image
                    src={message.image_url}
                    alt="Outfit"
                    width={300}
                    height={400}
                    className="rounded-lg object-cover border-2 border-white/20"
                  />
                  {message.processed_image_url && (
                    <div className="mt-2 text-xs text-pink-200">
                      ✨ Enhanced version available
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <p className="text-sm leading-relaxed">{message.content}</p>
            
            {message.ai_feedback && (
              <div className="mt-3 p-3 bg-gradient-to-r from-pink-100/50 to-purple-100/50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200/30 dark:border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="font-medium text-sm text-pink-700 dark:text-pink-300">Sister's Real Talk:</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{message.ai_feedback}</p>
              </div>
            )}
            
            {message.shopping_suggestions && message.shopping_suggestions.length > 0 && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/30 dark:border-pink-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm text-purple-700 dark:text-purple-300">Similar Vibes:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {message.shopping_suggestions.slice(0, 4).map((item: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-white/60 dark:bg-gray-800/60 rounded border border-white/40">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{item.name}</div>
                      <div className="text-gray-600 dark:text-gray-400">{item.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={`text-xs mt-2 ${message.isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 