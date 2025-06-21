import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-end">
          <ThemeToggle />
        </div>
      </header>
      <main className="container flex h-[calc(100vh-3.5rem)] items-center justify-center">
        {children}
      </main>
    </div>
  );
} 