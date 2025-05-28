import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "SistaChat - Your AI Fashion Sister",
  description: "Get honest, encouraging fashion feedback from your AI sister who always keeps it real ✨",
};

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-foreground particles animate-gradient">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col relative">
            <nav className="w-full glass backdrop-blur-md sticky top-0 z-50 animate-slide-up">
              <div className="w-full max-w-7xl mx-auto flex justify-between items-center p-4 px-6">
                <div className="flex gap-6 items-center">
                  <Link href={"/"} className="flex items-center gap-3 group hover-lift">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-glow">
                      <span className="text-white font-bold text-lg animate-wiggle">S</span>
                    </div>
                    <span className="font-bold text-xl gradient-text group-hover:animate-pulse transition-all">
                      SistaChat
                    </span>
                  </Link>
                  <div className="hidden md:flex items-center gap-6 ml-8">
                    <Link href="/chat" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 font-medium hover-lift">
                      Chat
                    </Link>
                    <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 font-medium hover-lift">
                      Dashboard
                    </Link>
                    <Link href="/settings" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 font-medium hover-lift">
                      Settings
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  <div className="hover-lift">
                    <ThemeSwitcher />
                  </div>
                </div>
              </div>
            </nav>
            
            <main className="flex-1 w-full animate-fade-in overflow-auto">
              {children}
            </main>

            <footer className="w-full glass backdrop-blur-md animate-slide-up">
              <div className="max-w-7xl mx-auto py-8 px-6">
                <div className="grid md:grid-cols-4 gap-8 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <span className="font-bold gradient-text">SistaChat</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your AI fashion sister who always keeps it 💯
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Product</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/chat" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Chat</Link></li>
                      <li><Link href="/upload" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Upload</Link></li>
                      <li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Pricing</Link></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Company</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">About</Link></li>
                      <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Contact</Link></li>
                      <li><Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Blog</Link></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Legal</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Privacy Policy</Link></li>
                      <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Terms of Service</Link></li>
                      <li><Link href="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Cookie Policy</Link></li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t border-pink-200/50 dark:border-purple-500/20 pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm animate-float">
                      Made with 💕 for sisters supporting sisters
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <p className="text-gray-500 dark:text-gray-500">
                        © 2024 SistaChat. All rights reserved.
                      </p>
                      <p className="text-gray-500 dark:text-gray-500">
                        Powered by{" "}
                        <a
                          href="https://supabase.com"
                          target="_blank"
                          className="font-medium hover:text-pink-600 dark:hover:text-pink-400 transition-colors hover-glow"
                          rel="noreferrer"
                        >
                          Supabase
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
