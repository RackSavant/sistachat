export default function AboutPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16 particles">
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            About SistaChat ✨
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your AI fashion sister who always keeps it 💯 - honest, encouraging, and here to help you serve looks every single day.
          </p>
        </div>

        {/* Mission */}
        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-4">Our Mission 💕</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            We believe every person deserves honest, encouraging fashion feedback without judgment. 
            SistaChat was born from the idea that everyone needs that one friend who will tell you 
            the truth about your outfit while still hyping you up. Our AI sister combines the 
            honesty of your most trusted friend with the encouragement of your biggest supporter.
          </p>
        </div>

        {/* Story */}
        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-4">The Story Behind SistaChat 👗</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              Picture this: You're getting ready for a big day, you try on three different outfits, 
              and you're still not sure which one hits different. Your friends are busy, your mirror 
              isn't giving you the feedback you need, and you're running out of time.
            </p>
            <p>
              That's where SistaChat comes in. We created an AI that understands fashion, reads the 
              room, and gives you that real sister energy - the kind that says "Girl, that color 
              is NOT it" but also "Babe, you're absolutely glowing in that dress!"
            </p>
            <p>
              Our AI sister isn't just about fashion rules - she's about helping you feel confident, 
              expressing your unique style, and making sure you step out feeling like the main character 
              you are. Because at the end of the day, fashion is about feeling good in your own skin.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-xl hover-lift animate-fade-in">
            <div className="text-3xl mb-4">🗣️</div>
            <h3 className="text-xl font-bold mb-3">Honest Feedback</h3>
            <p className="text-gray-600 dark:text-gray-300">
              No sugar-coating, no fake compliments. Just real talk delivered with love and respect.
            </p>
          </div>

          <div className="glass p-6 rounded-xl hover-lift animate-fade-in" style={{animationDelay: '0.1s'}}>
            <div className="text-3xl mb-4">💪</div>
            <h3 className="text-xl font-bold mb-3">Empowerment</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Building confidence through style, helping you express your authentic self.
            </p>
          </div>

          <div className="glass p-6 rounded-xl hover-lift animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="text-3xl mb-4">🤗</div>
            <h3 className="text-xl font-bold mb-3">Inclusivity</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Fashion advice for every body, every style, every budget. No judgment, just support.
            </p>
          </div>

          <div className="glass p-6 rounded-xl hover-lift animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-3">Fun</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Fashion should be fun! We bring the energy, the laughs, and the sisterly vibes.
            </p>
          </div>
        </div>

        {/* Team */}
        <div className="glass p-8 rounded-xl hover-lift animate-fade-in text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">Built with Love 💕</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            SistaChat is crafted by a team that believes technology should feel human, 
            personal, and empowering. We're here to make sure you always have that 
            supportive voice cheering you on, no matter what you're wearing or where you're going.
          </p>
        </div>
      </div>
    </div>
  );
} 