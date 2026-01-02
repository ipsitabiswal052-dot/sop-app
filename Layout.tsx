import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, FileText, UserCircle } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-primary hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              SOP Manager
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant={location === "/dashboard" ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              {user.currentBatchId && (
                <Link href={`/sop/${user.currentBatchId}`}>
                  <Button variant={location.startsWith("/sop") ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Current Batch
                  </Button>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-medium leading-none">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
            
            <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block"></div>

            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 bg-white dark:bg-black/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Internal SOP Management System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
