import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
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
        <h2 className="text-2xl font-bold gradient-text mb-2">Notifications 🔔</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage how you receive updates from SistaChat
        </p>
      </div>

      <div className="space-y-4">
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Fashion Feedback</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Get notified when you receive outfit feedback</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-pink-600" />
          </div>
        </div>

        <div className="glass p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Friend Requests</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Get notified when someone wants to be your fashion friend</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-pink-600" />
          </div>
        </div>

        <div className="glass p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Style Tips</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Receive weekly style tips and trends</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-pink-600" />
          </div>
        </div>
      </div>
    </div>
  );
} 