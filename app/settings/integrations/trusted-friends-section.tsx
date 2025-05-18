"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface TrustedFriend {
  id: string;
  friend_nickname: string;
  friend_identifier_info: string | null;
  user_id: string;
  created_at: string;
}

interface TrustedFriendsSectionProps {
  userId: string;
  initialFriends: TrustedFriend[];
}

export default function TrustedFriendsSection({
  userId,
  initialFriends,
}: TrustedFriendsSectionProps) {
  const [friends, setFriends] = useState<TrustedFriend[]>(initialFriends);
  const [nickname, setNickname] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const supabase = createClient();

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.from("user_trusted_friends").insert({
        user_id: userId,
        friend_nickname: nickname,
        friend_identifier_info: identifier || null,
      }).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setFriends([...friends, data[0]]);
        setSuccessMessage("Friend added successfully");
        setNickname("");
        setIdentifier("");
      }
    } catch (err) {
      console.error("Error adding friend:", err);
      setError(
        err instanceof Error ? err.message : "Failed to add friend"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFriend = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from("user_trusted_friends")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFriends(friends.filter(friend => friend.id !== id));
      setSuccessMessage("Friend removed successfully");
    } catch (err) {
      console.error("Error deleting friend:", err);
      setError(
        err instanceof Error ? err.message : "Failed to remove friend"
      );
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* List of current trusted friends */}
      {friends.length === 0 ? (
        <div className="py-4 text-center border border-dashed border-border rounded-md bg-muted/50">
          <p className="text-muted-foreground">
            You haven't added any trusted friends yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Your Trusted Friends</h3>
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-md"
              >
                <div>
                  <p className="font-medium">{friend.friend_nickname}</p>
                  {friend.friend_identifier_info && (
                    <p className="text-sm text-muted-foreground">
                      {friend.friend_identifier_info}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFriend(friend.id)}
                  disabled={deletingIds.has(friend.id)}
                >
                  {deletingIds.has(friend.id) ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form to add new trusted friend */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-medium mb-4">Add New Trusted Friend</h3>
        
        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}
        
        {successMessage && (
          <p className="text-sm text-green-600 mb-4">{successMessage}</p>
        )}
        
        <form onSubmit={handleAddFriend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friend-nickname">Friend's Nickname</Label>
            <Input
              id="friend-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Jane from Work"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="friend-identifier">
              Friend's Identifier (for future use)
            </Label>
            <Input
              id="friend-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g., WhatsApp number, email, etc."
            />
            <p className="text-xs text-muted-foreground">
              This information will be used when direct messaging is implemented
            </p>
          </div>
          
          <Button type="submit" disabled={loading || !nickname}>
            {loading ? "Adding..." : "Add Friend"}
          </Button>
        </form>
      </div>
    </div>
  );
} 