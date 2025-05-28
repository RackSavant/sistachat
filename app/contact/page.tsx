import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16 particles">
      <div className="space-y-12">
        {/* Hero */}
        <div className="text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Get in Touch 💬
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Have questions, feedback, or just want to chat? We'd love to hear from you, babe!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
            <h2 className="text-2xl font-bold gradient-text mb-6">Send us a Message ✨</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Your first name" 
                    className="glass border-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Your last name" 
                    className="glass border-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  className="glass border-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              
              <div>
                <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="What's this about?" 
                  className="glass border-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              
              <div>
                <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us what's on your mind..." 
                  rows={6}
                  className="glass border-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow">
                Send Message 💕
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-xl hover-lift animate-fade-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📧</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Email Us</h3>
                  <p className="text-gray-600 dark:text-gray-300">We usually respond within 24 hours</p>
                </div>
              </div>
              <p className="text-pink-600 dark:text-pink-400 font-medium">hello@sistachat.com</p>
            </div>

            <div className="glass p-6 rounded-xl hover-lift animate-fade-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">💬</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Live Chat</h3>
                  <p className="text-gray-600 dark:text-gray-300">Chat with our support team</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Available Mon-Fri, 9AM-6PM PST</p>
            </div>

            <div className="glass p-6 rounded-xl hover-lift animate-fade-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🐦</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Social Media</h3>
                  <p className="text-gray-600 dark:text-gray-300">Follow us for style tips & updates</p>
                </div>
              </div>
              <div className="flex gap-4">
                <a href="#" className="text-pink-600 dark:text-pink-400 hover:text-pink-500 transition-colors">@sistachat</a>
                <a href="#" className="text-pink-600 dark:text-pink-400 hover:text-pink-500 transition-colors">@sistachat_official</a>
              </div>
            </div>

            <div className="glass p-6 rounded-xl hover-lift animate-fade-in">
              <h3 className="font-bold text-lg mb-3">FAQ 🤔</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Check out our frequently asked questions for quick answers to common questions.
              </p>
              <Button variant="outline" className="glass-pink hover-lift">
                View FAQ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 