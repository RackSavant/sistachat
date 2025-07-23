import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Heart } from 'lucide-react';

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium glass-pink animate-pulse hover-lift">
            ✨ Choose Your Sister Tier ✨
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6 animate-glow">
            Level Up Your Style Game
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From free advice to VIP treatment - find the perfect plan for your fashion journey 💅
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Tier */}
          <div className="glass rounded-3xl p-8 hover-lift transition-all duration-300 border-2 border-transparent hover:border-pink-200/50">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Free Tier</h3>
              <div className="text-4xl font-bold gradient-text mb-2">$0</div>
              <p className="text-gray-600 dark:text-gray-400">forever</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Basic outfit feedback</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">3 photos per day</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">General style tips</span>
              </li>
            </ul>
            
            <Button variant="outline" className="w-full glass-pink hover-lift btn-interactive">
              Current Plan
            </Button>
          </div>

          {/* Pledge Sister - $1/month */}
          <div className="glass rounded-3xl p-8 hover-lift transition-all duration-300 border-2 border-pink-300/50 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                Most Popular
              </Badge>
            </div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-glow">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Pledge Sister</h3>
              <div className="text-4xl font-bold gradient-text mb-2">$1</div>
              <p className="text-gray-600 dark:text-gray-400">per month</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Everything in Free</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">15 photos per day</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Personalized recommendations</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Priority support</span>
              </li>
            </ul>
            
            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow">
              Upgrade to Pledge Sister
            </Button>
          </div>

          {/* Fully-Crossed Sister - $30/month */}
          <div className="glass rounded-3xl p-8 hover-lift transition-all duration-300 border-2 border-yellow-300/50 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                VIP
              </Badge>
            </div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-glow">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Fully-Crossed Sister</h3>
              <div className="text-4xl font-bold gradient-text mb-2">$30</div>
              <p className="text-gray-600 dark:text-gray-400">per month</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Everything in Pledge Sister</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited photos</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Personal styling sessions</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Exclusive fashion insights</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Early access to new features</span>
              </li>
            </ul>
            
            <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white btn-interactive hover-lift animate-glow">
              Upgrade to Fully-Crossed Sister
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center gradient-text mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass p-6 rounded-2xl hover-lift">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Absolutely! No contracts, no commitments. Cancel your subscription anytime with just one click.
              </p>
            </div>
            
            <div className="glass p-6 rounded-2xl hover-lift">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, PayPal, and Apple Pay for your convenience.
              </p>
            </div>
            
            <div className="glass p-6 rounded-2xl hover-lift">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Is my data secure?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your privacy is our priority. All photos and data are encrypted and never shared with third parties.
              </p>
            </div>
            
            <div className="glass p-6 rounded-2xl hover-lift">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! If you're not satisfied within the first 7 days, we'll provide a full refund, no questions asked.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Chat */}
        <div className="text-center mt-16">
          <Link href="/chat">
            <Button variant="outline" className="glass-pink hover-lift btn-interactive">
              ← Back to Chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
