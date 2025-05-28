'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Send, Image as ImageIcon, Sparkles, ShoppingBag } from 'lucide-react';
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
    // Simple AI response for text messages
    const responses = [
      "Girl, I love that you're thinking about your style! Tell me more about what you're going for! ✨",
      "Ooh, I'm excited to help! Do you have any outfit pics to show me? 📸",
      "Babe, you know I'm always here for the fashion chat! What's on your mind? 💫",
      "Honestly, I'm so here for this conversation! Spill the tea about your style goals! ☕",
      "I'm obsessed with helping you put together amazing looks! What are we working with? 👗"
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👗✨</div>
            <h2 className="text-2xl font-bold mb-2">Hey girl! Ready for some style talk?</h2>
            <p className="text-muted-foreground mb-6">
              Upload your outfit pics or just start chatting about your style goals!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Upload Outfit
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
      <div className="border-t p-4">
        <div
          className={`relative ${dragActive ? 'bg-accent/50 border-2 border-dashed border-primary' : ''}`}
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
                placeholder="Tell me about your outfit or style goals..."
                className="min-h-[60px] resize-none"
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
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-accent/80 rounded-lg">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Drop your outfit pic here!</p>
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
        <Card className={`${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <CardContent className="p-4">
            {message.message_type === 'image' && message.image_url && (
              <div className="mb-3">
                <div className="relative w-full max-w-sm mx-auto">
                  <Image
                    src={message.image_url}
                    alt="Outfit"
                    width={300}
                    height={400}
                    className="rounded-lg object-cover"
                  />
                  {message.processed_image_url && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      ✨ Enhanced version available
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <p className="text-sm">{message.content}</p>
            
            {message.ai_feedback && (
              <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium text-sm">Sister's Take:</span>
                </div>
                <p className="text-sm">{message.ai_feedback}</p>
              </div>
            )}
            
            {message.shopping_suggestions && message.shopping_suggestions.length > 0 && (
              <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="font-medium text-sm">Similar Items:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {message.shopping_suggestions.slice(0, 4).map((item: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-background rounded">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">{item.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs opacity-70 mt-2">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 