'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Friend {
  id: string;
  name: string;
  phone_number: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // New friend form state
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch friends on component mount
  useEffect(() => {
    fetchFriends();
  }, []);
  
  const fetchFriends = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_trusted_friends')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setFriends(data || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load your trusted friends list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    if (!newFriendName.trim() || !newFriendPhone.trim()) {
      setError('Name and phone number are required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const supabase = createClient();
      
      // Format phone number to E.164 format
      const formattedPhone = formatPhoneNumber(newFriendPhone);
      
      // Check if phone number already exists
      const { data: existingFriend } = await supabase
        .from('user_trusted_friends')
        .select('id')
        .eq('phone_number', formattedPhone)
        .single();
      
      if (existingFriend) {
        setError('This phone number is already in your trusted friends list');
        setIsSubmitting(false);
        return;
      }
      
      // Add the new friend
      const { data, error } = await supabase
        .from('user_trusted_friends')
        .insert({
          name: newFriendName.trim(),
          phone_number: formattedPhone
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Add to the local state
      setFriends([...friends, data]);
      
      // Reset form
      setNewFriendName('');
      setNewFriendPhone('');
      setSuccess('Friend added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error adding friend:', err);
      setError('Failed to add friend. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveFriend = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const supabase = createClient();
      const { error } = await supabase
        .from('user_trusted_friends')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setFriends(friends.filter(friend => friend.id !== id));
      setSuccess('Friend removed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error removing friend:', err);
      setError('Failed to remove friend. Please try again.');
    }
  };
  
  // Format phone number to E.164 format
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
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Manage Trusted Friends</h1>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Friend Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Friend</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFriend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Friend's Name</Label>
                <Input
                  id="name"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newFriendPhone}
                  onChange={(e) => setNewFriendPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
                <p className="text-xs text-gray-500">
                  Format: Country code + area code + number (e.g., +15551234567)
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Friend'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Friends List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Trusted Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading friends...
                  </p>
                </div>
              ) : friends.length === 0 ? (
                <div className="py-6 text-center border border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    You haven't added any trusted friends yet
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {friends.map((friend) => (
                    <li key={friend.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-gray-500">{formatPhoneForDisplay(friend.phone_number)}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveFriend(friend.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              These friends can receive SMS requests for outfit feedback
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
} 