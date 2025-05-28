export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 particles">
      <div className="w-full max-w-md">
        <div className="glass hover-lift p-8 rounded-xl animate-scale-in">
          {children}
        </div>
      </div>
    </div>
  );
}
