import { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const settingsLinks = [
    {
      title: "Profile",
      href: "/settings/profile",
      description: "Manage your account settings and preferences",
    },
    {
      title: "Integrations",
      href: "/settings/integrations",
      description: "Configure social media connections and manage trusted friends",
    },
    {
      title: "Subscription",
      href: "/settings/subscription",
      description: "Manage your subscription plan and billing",
    },
  ];

  return (
    <div className="flex-1 w-full py-12 px-4 md:px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-12">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-64 flex-shrink-0">
          <nav className="space-y-2 sticky top-24">
            {settingsLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="font-medium">{link.title}</div>
                <div className="text-sm text-muted-foreground mt-1 hidden md:block">
                  {link.description}
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 