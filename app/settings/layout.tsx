import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const navItems = [
    { href: "/settings/profile", label: "Profile", icon: "👤" },
    { href: "/settings/notifications", label: "Notifications", icon: "🔔" },
    { href: "/settings/subscription", label: "Billing", icon: "💳" },
    { href: "/settings/integrations", label: "Integrations", icon: "🔗" },
    { href: "/settings/friends", label: "Friends", icon: "👭" },
    { href: "/settings/danger", label: "Danger Zone", icon: "⚠️" },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 particles">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text mb-2">Settings ⚙️</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="glass p-4 rounded-xl hover-lift animate-fade-in">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors hover-lift"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="glass p-6 rounded-xl hover-lift animate-scale-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 