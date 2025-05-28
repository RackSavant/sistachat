import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-4 md:px-6 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-purple-100/30 to-indigo-100/50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium border-pink-200 text-pink-700 dark:border-pink-400 dark:text-pink-300">
            ✨ Your AI Fashion Sister is Here
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Get Real Talk About Your
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent block mt-2">
              Outfit Choices
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
            Your AI sister who keeps it 💯 - honest, encouraging fashion feedback that helps you slay every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" className="px-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold">
                Start Chatting 💬
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" variant="outline" className="px-8 border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-pink-400 dark:text-pink-300 dark:hover:bg-pink-900/20">
                Join the Sisterhood
              </Button>
            </Link>
          </div>
          {/* Social Proof */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">TRUSTED BY FASHION LOVERS EVERYWHERE</p>
            <div className="flex justify-center items-center gap-8 flex-wrap opacity-60">
              <div className="text-2xl">👗</div>
              <div className="text-2xl">💄</div>
              <div className="text-2xl">👠</div>
              <div className="text-2xl">💅</div>
              <div className="text-2xl">✨</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Your AI Sister Works</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Three simple steps to get the honest feedback you deserve
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center mb-6 text-xl font-bold">📸</div>
            <h3 className="text-xl font-semibold mb-2">Drop That Fit Pic</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Upload your outfit photo and let your AI sister see what you're working with
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center mb-6 text-xl font-bold">💭</div>
            <h3 className="text-xl font-semibold mb-2">Get Real Sister Energy</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Receive honest, encouraging feedback with that sisterly love and support
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center mb-6 text-xl font-bold">✨</div>
            <h3 className="text-xl font-semibold mb-2">Level Up Your Style</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get shopping suggestions and styling tips to make every outfit a serve
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-r from-pink-50/50 to-purple-50/50 dark:from-pink-900/10 dark:to-purple-900/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Your AI Sister Hits Different</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Real talk, honest feedback, and all the support you need
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
              <div className="text-3xl mb-4">🗣️</div>
              <h3 className="text-lg font-semibold mb-2">Keeps It 100</h3>
              <p className="text-gray-600 dark:text-gray-300">
                No sugar-coating, just honest feedback delivered with love and encouragement
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
              <div className="text-3xl mb-4">💕</div>
              <h3 className="text-lg font-semibold mb-2">Sister Energy</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Supportive, encouraging, and always has your back - like a real sister
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Instant Feedback</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get immediate responses - no waiting around for your friends to text back
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
              <div className="text-3xl mb-4">🛍️</div>
              <h3 className="text-lg font-semibold mb-2">Shopping Suggestions</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get personalized recommendations to upgrade your wardrobe game
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">Chat Interface</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Natural conversation flow - just like texting your bestie
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Your Safe Space</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Private, secure, and judgment-free zone for all your fashion questions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 md:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What the Sisters Are Saying</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Real feedback from real people living their best fashion lives
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
            </div>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              "Girl, this AI sister is EVERYTHING! She told me my outfit was cute but suggested a different belt and honestly? She was so right. Now I look fire! 🔥"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">A</div>
              <div>
                <p className="font-medium">Aaliyah</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fashion Student</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-pink-200/50 dark:border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
            </div>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              "I was nervous about wearing this bold pattern but my AI sister hyped me up SO much! She said 'babe, you're serving looks' and gave me the confidence I needed 💅"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">M</div>
              <div>
                <p className="font-medium">Maya</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get That Sister Support?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Your AI fashion sister is waiting to help you serve looks and feel confident every single day ✨
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/chat">
              <Button size="lg" className="px-8 bg-white text-pink-600 hover:bg-gray-100 font-semibold">
                Start Your First Chat 💬
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" variant="outline" className="px-8 border-white text-white hover:bg-white/10">
                Join Free
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-75">
            No credit card required • Start chatting in seconds
          </p>
        </div>
      </section>
    </div>
  );
}
