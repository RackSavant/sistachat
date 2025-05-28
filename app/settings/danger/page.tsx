import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function DangerZonePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone ⚠️</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Irreversible and destructive actions
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 p-6 rounded-lg">
          <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">Delete All Chat History</h3>
          <p className="text-red-700 dark:text-red-300 text-sm mb-4">
            This will permanently delete all your chat conversations and outfit feedback. This action cannot be undone.
          </p>
          <Button variant="destructive" className="hover-lift">
            Delete Chat History
          </Button>
        </div>

        <div className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 p-6 rounded-lg">
          <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">Delete Account</h3>
          <p className="text-red-700 dark:text-red-300 text-sm mb-4">
            This will permanently delete your account, all your data, chat history, and uploaded images. This action cannot be undone.
          </p>
          <Button variant="destructive" className="hover-lift">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
} 