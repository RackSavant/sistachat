"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export default function FeedbackRequestButton({ outfitId }: { outfitId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<{ id: string; name: string; phone: string; selected: boolean }[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch friends when the component opens
  const fetchFriends = async () => {
    if (isOpen && friends.length === 0) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_trusted_friends')
        .select('*');
      
      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }
      
      if (data) {
        setFriends(data.map(friend => ({
          id: friend.id,
          name: friend.name,
          phone: friend.phone_number,
          selected: false
        })));
      }
    }
  };
  
  const toggleFriend = (id: string) => {
    setFriends(friends.map(friend => 
      friend.id === id ? { ...friend, selected: !friend.selected } : friend
    ));
  };
  
  const handleSendInvites = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    const selectedFriends = friends.filter(friend => friend.selected);
    const phoneNumbers = selectedFriends.map(friend => friend.phone);
    
    // Add the new phone number if provided
    if (newPhone.trim()) {
      phoneNumbers.push(formatPhoneNumber(newPhone.trim()));
    }
    
    if (phoneNumbers.length === 0) {
      setError('Please select at least one friend or add a phone number');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/send-sms-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outfitId,
          phoneNumbers
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS invites');
      }
      
      setSuccess('SMS invites sent successfully!');
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload(); // Refresh the page to update status
      }, 2000);
      
    } catch (error) {
      console.error('Error sending invites:', error);
      setError((error as Error).message || 'Failed to send SMS invites');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format phone number to E.164 format (just a simple implementation)
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it starts with a country code (like +1), keep it, otherwise assume US and add +1
    if (digits.startsWith('1') && digits.length === 11) {
      return `+${digits}`;
    } else if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // Return as is if we can't determine the format
    return phone;
  };
  
  return (
    <div>
      {!isOpen ? (
        <Button onClick={() => {
          setIsOpen(true);
          fetchFriends();
        }}>
          Get Friend Feedback
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Request Friend Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 p-3 rounded text-red-600 mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 p-3 rounded text-green-600 mb-4">
                {success}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Select friends to ask for feedback:</h3>
                
                {friends.length > 0 ? (
                  <div className="space-y-2">
                    {friends.map(friend => (
                      <div key={friend.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`friend-${friend.id}`} 
                          checked={friend.selected}
                          onCheckedChange={() => toggleFriend(friend.id)}
                        />
                        <Label htmlFor={`friend-${friend.id}`} className="cursor-pointer">
                          {friend.name} ({friend.phone})
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    You haven't added any trusted friends yet.
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Or send to a phone number:</h3>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: Country code + area code + number (e.g., +15551234567)
                </p>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvites}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send SMS Invites'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 