import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TrustedFriendsSection from "./trusted-friends-section";

export const metadata = {
  title: "Integrations - Sister Chat",
  description: "Manage your connected accounts and trusted friends",
};

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's trusted friends
  const { data: trustedFriends } = await supabase
    .from("user_trusted_friends")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Integrations</h2>

      <div className="space-y-8">
        {/* Facebook Integration (Future) */}
        <Card>
          <CardHeader>
            <CardTitle>Facebook Integration</CardTitle>
            <CardDescription>Connect your Facebook account to easily share with your friends (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Connect Facebook
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is coming soon! Stay tuned for updates.
            </p>
          </CardContent>
        </Card>

        {/* Trusted Friends Section */}
        <Card>
          <CardHeader>
            <CardTitle>Trusted Friends</CardTitle>
            <CardDescription>Manage the friends you trust to give you honest feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <TrustedFriendsSection userId={user.id} initialFriends={trustedFriends || []} />
          </CardContent>
        </Card>

        {/* WhatsApp Integration (Future) */}
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Integration</CardTitle>
            <CardDescription>Connect your WhatsApp account to share with your contacts (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Connect WhatsApp
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is coming soon! Stay tuned for updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 