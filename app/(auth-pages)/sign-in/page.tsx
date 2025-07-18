import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Login(props: { searchParams: Promise<Message> }) {
  // Redirect directly to chat page, bypassing sign-in requirement
  redirect('/chat');
  
  // The code below won't execute due to the redirect
  const searchParams = await props.searchParams;
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold gradient-text mb-2">Welcome Back, Babe! ✨</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Ready to get that fashion feedback?
        </p>
      </div>
      
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input 
            name="email" 
            placeholder="you@example.com" 
            required 
            className="glass border-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Link
              className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-500 transition-colors"
              href="/forgot-password"
            >
              Forgot Password?
            </Link>
          </div>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            required
            className="glass border-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
        
        <SubmitButton 
          pendingText="Signing In..." 
          formAction={signInAction}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow"
        >
          Sign In
        </SubmitButton>
        
        <FormMessage message={searchParams} />
      </form>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Don't have an account?{" "}
          <Link className="text-pink-600 dark:text-pink-400 font-medium hover:text-pink-500 transition-colors" href="/sign-up">
            Join the sisterhood
          </Link>
        </p>
      </div>
    </div>
  );
}
