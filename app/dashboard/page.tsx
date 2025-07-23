import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get recent chats
  const { data: recentChats } = await supabase
    .from('chats')
    .select('id, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3);

  // Get recent messages count
  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 particles">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text mb-2">Hey babe! Ready to slay? ✨</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload your outfit or start chatting with your AI fashion sister
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="glass hover-lift animate-scale-in">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-glow">
                <span className="text-2xl">📸</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Upload Your Outfit</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Drop that fit pic and get instant feedback from your AI sister
                </p>
                <Link href="/upload">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow">
                    Upload Now 📸
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift animate-scale-in" style={{animationDelay: '0.1s'}}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto animate-glow">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Start Chatting</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Ask questions about style, get outfit ideas, or just chat about fashion
                </p>
                <Link href="/chat">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white btn-interactive hover-lift animate-glow">
                    Start Chat 💬
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift animate-scale-in" style={{animationDelay: '0.2s'}}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto animate-glow">
                <span className="text-2xl">👓</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Live Outfit Feedback</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Use your Mentra glasses to get real-time AI fashion feedback
                </p>
                <Link href="/mentra-live">
                  <Button className="bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white btn-interactive hover-lift animate-glow">
                    Go Live 👓
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats & Recent Activity */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="glass hover-lift animate-fade-in">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold gradient-text mb-2">{totalMessages || 0}</div>
            <p className="text-gray-600 dark:text-gray-300">Messages Exchanged</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift animate-fade-in" style={{animationDelay: '0.1s'}}>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold gradient-text mb-2">{recentChats?.length || 0}</div>
            <p className="text-gray-600 dark:text-gray-300">Active Conversations</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift animate-fade-in" style={{animationDelay: '0.2s'}}>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold gradient-text mb-2">💅</div>
            <p className="text-gray-600 dark:text-gray-300">Fashion Sister</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Chats */}
      {recentChats && recentChats.length > 0 && (
        <Card className="glass hover-lift animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Recent Conversations 💭</h3>
              <Link href="/chat" className="text-pink-600 dark:text-pink-400 hover:text-pink-500 transition-colors text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <div key={chat.id} className="flex items-center justify-between p-3 glass rounded-lg hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">👗</span>
                    </div>
                    <div>
                      <p className="font-medium">Fashion Chat</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Link href="/chat">
                    <Button variant="outline" size="sm" className="glass-pink hover-lift">
                      Continue
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 