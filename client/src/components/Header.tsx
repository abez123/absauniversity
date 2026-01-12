import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { ES } from "@/constants/es";

export default function Header() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-full items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/logo-absa.png" alt="ABSA" className="h-8 w-auto" />
          <span className="hidden sm:inline font-bold text-lg text-foreground">
            {ES.appName}
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <a href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                {ES.courses}
              </a>
              {user.role === "admin" && (
                <a href="/admin" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  {ES.adminPanel}
                </a>
              )}
            </>
          )}
        </nav>

        {/* User Menu */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {ES.signOut}
              </Button>
            </>
          ) : null}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container px-4 py-4 space-y-4">
            <a
              href="/"
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {ES.courses}
            </a>
            {user.role === "admin" && (
              <a
                href="/admin"
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {ES.adminPanel}
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full gap-2 justify-start"
            >
              <LogOut className="h-4 w-4" />
              {ES.signOut}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
