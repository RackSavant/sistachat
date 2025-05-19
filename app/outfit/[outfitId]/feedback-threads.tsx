"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';

interface FeedbackSolicitation {
  id: string;
  outfit_id: string;
  friend_phone_number: string;
  friend_name?: string;
  status: string;
  friend_reply_text?: string;
  solicited_at: string;
  replied_at?: string;
}

export default function FeedbackThreads({ outfitId }: { outfitId: string }) {
  const [solicitations, setSolicitations] = useState<FeedbackSolicitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // Fetch solicitations
        const { data, error } = await supabase
          .from('sms_feedback_solicitations')
          .select('*')
          .eq('outfit_id', outfitId)
          .order('solicited_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Get friend names if available
        if (data) {
          // Create a set of unique phone numbers
          const phoneNumbers = [...new Set(data.map(s => s.friend_phone_number))];
          
          // Fetch friend names for these phone numbers
          const { data: friends, error: friendsError } = await supabase
            .from('user_trusted_friends')
            .select('name, phone_number')
            .in('phone_number', phoneNumbers);
          
          if (friendsError) {
            console.error('Error fetching friend names:', friendsError);
          }
          
          // Create a map of phone numbers to friend names
          const friendsMap = new Map();
          if (friends) {
            friends.forEach(friend => {
              friendsMap.set(friend.phone_number, friend.name);
            });
          }
          
          // Enhance the solicitations with friend names
          const enhancedSolicitations = data.map(solicitation => ({
            ...solicitation,
            friend_name: friendsMap.get(solicitation.friend_phone_number)
          }));
          
          setSolicitations(enhancedSolicitations);
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeedback();
    
    // Set up real-time subscription for updates
    const setupSubscription = async () => {
      const supabase = createClient();
      
      const subscription = supabase
        .channel('sms_feedback_updates')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'sms_feedback_solicitations',
            filter: `outfit_id=eq.${outfitId}`
          }, 
          () => {
            // Refresh the data when we get an update
            fetchFeedback();
          }
        )
        .subscribe();
      
      // Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };
    
    const cleanup = setupSubscription();
    return () => {
      if (cleanup) {
        cleanup.then((unsub) => unsub());
      }
    };
  }, [outfitId]);
  
  // Format phone number for display
  const formatPhoneForDisplay = (phone: string) => {
    // Simple formatter - in production you'd want something more robust
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone; // Return as is if we can't format it
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Friend Feedback</CardTitle>
        <Badge>
          {solicitations.filter(s => s.status === 'reply_received').length} / {solicitations.length} Replies
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">
              Loading feedback...
            </p>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : solicitations.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              No feedback requests sent yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {solicitations.map((solicitation) => (
              <div key={solicitation.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">
                      {solicitation.friend_name || formatPhoneForDisplay(solicitation.friend_phone_number)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Sent {new Date(solicitation.solicited_at).toLocaleDateString()} at{' '}
                      {new Date(solicitation.solicited_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={solicitation.status === 'reply_received' ? 'default' : 'secondary'}>
                    {solicitation.status === 'reply_received' ? 'Replied' : 'Awaiting Reply'}
                  </Badge>
                </div>
                
                {solicitation.status === 'reply_received' && solicitation.friend_reply_text && (
                  <div className="bg-gray-50 rounded p-3 mt-2">
                    <p className="text-gray-800">{solicitation.friend_reply_text}</p>
                    {solicitation.replied_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Replied on {new Date(solicitation.replied_at).toLocaleDateString()} at{' '}
                        {new Date(solicitation.replied_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 