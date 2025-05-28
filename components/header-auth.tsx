import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none glass-pink animate-pulse"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none glass-pink"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none bg-gradient-to-r from-pink-500 to-purple-600"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 dark:text-gray-300 font-medium animate-float">
        Hey babe! 👋
      </span>
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"} className="glass-pink hover-lift btn-interactive">
          Sign out
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"} className="glass-pink hover-lift btn-interactive">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow">
        <Link href="/sign-up">Join the Sisterhood ✨</Link>
      </Button>
    </div>
  );
}
