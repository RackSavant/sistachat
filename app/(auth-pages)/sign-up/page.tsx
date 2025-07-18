import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  // Redirect directly to chat page, bypassing sign-up requirement
  redirect('/chat');
  
  // The code below won't execute due to the redirect
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full text-center">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold gradient-text mb-2">Join the Sisterhood! 💕</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Get ready for honest fashion feedback
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
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
            className="glass border-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
        
        <SubmitButton 
          formAction={signUpAction} 
          pendingText="Signing up..."
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow"
        >
          Sign Up
        </SubmitButton>
        
        <FormMessage message={searchParams} />
      </form>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link className="text-pink-600 dark:text-pink-400 font-medium hover:text-pink-500 transition-colors" href="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
