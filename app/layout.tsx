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
      <body className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col">
            <nav className="w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-pink-200/50 dark:border-purple-500/20 sticky top-0 z-50">
              <div className="w-full max-w-7xl mx-auto flex justify-between items-center p-4 px-6">
                <div className="flex gap-6 items-center">
                  <Link href={"/"} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent group-hover:from-pink-500 group-hover:to-purple-500 transition-all">
                      SistaChat
                    </span>
                  </Link>
                  <div className="hidden md:flex items-center gap-6 ml-8">
                    <Link href="/chat" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium">
                      Chat
                    </Link>
                    <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium">
                      Dashboard
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  <ThemeSwitcher />
                </div>
              </div>
            </nav>
            
            <div className="flex-1 w-full">
              {children}
            </div>

            <footer className="w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-pink-200/50 dark:border-purple-500/20 mt-auto">
              <div className="max-w-7xl mx-auto flex items-center justify-center text-center text-sm gap-8 py-8 px-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Made with 💕 for sisters supporting sisters
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs">
                  Powered by{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    className="font-medium hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                    rel="noreferrer"
                  >
                    Supabase
                  </a>
                </p>
              </div>
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
