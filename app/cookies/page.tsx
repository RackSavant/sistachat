export default function CookiePolicyPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16 particles">
      <div className="space-y-8">
        <div className="text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Cookie Policy 🍪
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We use cookies to make your SistaChat experience even better. Here's the tea on what we collect and why.
          </p>
        </div>

        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-4">What Are Cookies? 🤔</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Cookies are small text files that websites store on your device to remember information about you. 
            Think of them like little notes that help us remember your preferences and make your experience smoother.
          </p>
        </div>

        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-4">How We Use Cookies ✨</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Essential Cookies 🔧</h3>
              <p className="text-gray-700 dark:text-gray-300">
                These keep SistaChat working properly. They remember that you're logged in, 
                your chat history, and your basic preferences. We can't turn these off because 
                the site wouldn't work without them.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Analytics Cookies 📊</h3>
              <p className="text-gray-700 dark:text-gray-300">
                These help us understand how you use SistaChat so we can make it better. 
                We see things like which features you love most and where you might be getting stuck.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Preference Cookies ⚙️</h3>
              <p className="text-gray-700 dark:text-gray-300">
                These remember your settings like dark mode, language preferences, 
                and other customizations that make SistaChat feel like yours.
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-4">Managing Your Cookies 🎛️</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              You're in control, babe! You can manage cookies through your browser settings. 
              Here's how to do it in the most popular browsers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Note: Disabling certain cookies might affect how SistaChat works for you.
            </p>
          </div>
        </div>

        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-4">Third-Party Cookies 🤝</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Sometimes we work with trusted partners (like analytics providers) who might also set cookies. 
            We only work with companies that respect your privacy as much as we do. These cookies help us 
            understand how to make SistaChat even better for you.
          </p>
        </div>

        <div className="glass p-8 rounded-xl hover-lift animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-4">Updates to This Policy 📝</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We might update this cookie policy from time to time. When we do, we'll let you know 
            and update the date at the top. We'll always be transparent about any changes.
          </p>
        </div>

        <div className="glass p-8 rounded-xl hover-lift animate-fade-in text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">Questions? 💬</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            If you have any questions about our cookie policy, we're here to help! 
            Reach out to us anytime.
          </p>
          <a 
            href="/contact" 
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium btn-interactive hover-lift transition-all"
          >
            Contact Us
          </a>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Last updated: December 18, 2024</p>
        </div>
      </div>
    </div>
  );
} 