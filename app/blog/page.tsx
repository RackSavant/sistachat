import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "5 Ways to Style Your Basic Tee That'll Have You Serving Looks",
      excerpt: "Girl, that basic tee in your closet has SO much potential! Let's unlock those styling secrets...",
      date: "Dec 15, 2024",
      readTime: "3 min read",
      category: "Styling Tips",
      image: "👕"
    },
    {
      id: 2,
      title: "Color Theory for Real People: What Actually Works",
      excerpt: "Forget those complicated color wheels - here's how to actually pick colors that make you glow...",
      date: "Dec 12, 2024",
      readTime: "5 min read",
      category: "Color Guide",
      image: "🎨"
    },
    {
      id: 3,
      title: "Thrift Flipping 101: Turn $5 Finds into $50 Looks",
      excerpt: "Your AI sister spills the tea on how to transform thrift store gems into statement pieces...",
      date: "Dec 10, 2024",
      readTime: "4 min read",
      category: "DIY Fashion",
      image: "♻️"
    },
    {
      id: 4,
      title: "Building a Capsule Wardrobe That Actually Makes Sense",
      excerpt: "Let's be real - most capsule wardrobe advice is unrealistic. Here's what actually works...",
      date: "Dec 8, 2024",
      readTime: "6 min read",
      category: "Wardrobe",
      image: "👗"
    },
    {
      id: 5,
      title: "Confidence is Your Best Accessory: How to Own Any Look",
      excerpt: "The secret ingredient that makes any outfit fire? It's not what you think...",
      date: "Dec 5, 2024",
      readTime: "3 min read",
      category: "Mindset",
      image: "✨"
    },
    {
      id: 6,
      title: "Seasonal Transition Outfits That Don't Break the Bank",
      excerpt: "Weather can't make up its mind? Neither can your wardrobe? We got you covered, babe...",
      date: "Dec 3, 2024",
      readTime: "4 min read",
      category: "Seasonal",
      image: "🍂"
    }
  ];

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-16 particles">
      <div className="space-y-12">
        {/* Hero */}
        <div className="text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            The SistaChat Blog 📝
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Real talk about fashion, style tips that actually work, and all the sisterly advice you need to serve looks every day.
          </p>
        </div>

        {/* Featured Post */}
        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-full">
              Featured
            </span>
            <span className="text-sm text-gray-500">Styling Tips</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-4">
            The Ultimate Guide to Finding Your Personal Style (Without Breaking the Bank)
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
            Your AI sister breaks down everything you need to know about discovering what makes you feel confident, 
            authentic, and absolutely fire - no matter your budget or body type. This is the real tea on personal style...
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Dec 18, 2024</span>
              <span>8 min read</span>
            </div>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift">
              Read More
            </Button>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <div key={post.id} className="glass p-6 rounded-xl hover-lift animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="text-4xl mb-4 text-center">{post.image}</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs font-medium rounded-full">
                  {post.category}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 leading-tight">{post.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
              <Button variant="outline" className="w-full glass-pink hover-lift">
                Read Article
              </Button>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="glass p-8 rounded-xl hover-lift animate-fade-in text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">Stay in the Loop, Babe! 💌</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Get weekly style tips, outfit inspiration, and sisterly advice delivered straight to your inbox. 
            No spam, just the good stuff!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="flex-1 px-4 py-3 glass border-none focus:ring-2 focus:ring-pink-400 rounded-lg"
            />
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift px-8">
              Subscribe ✨
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 