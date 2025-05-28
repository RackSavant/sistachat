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
              <div className="max-w-7xl mx-auto flex items-center justify-center text-center text-sm gap-8 py-8 px-6">
                <p className="text-gray-600 dark:text-gray-400 animate-float">
                  Made with 💕 for sisters supporting sisters
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs">
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
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
