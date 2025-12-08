import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, BarChart3, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative">
            <span className="font-display text-2xl font-bold text-neon">
              VibeBet
            </span>
            <div className="absolute -inset-1 -z-10 bg-primary/20 blur-lg rounded-full" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Start
          </Link>
          <Link 
            to="/archiwum" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Archiwum
          </Link>
          {user && (
            <Link 
              to="/moje-typy" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Moje Typy
            </Link>
          )}
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                Wyloguj
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Zaloguj się
              </Button>
              <Button variant="neon" size="sm" onClick={() => navigate('/auth?mode=signup')}>
                Dołącz teraz
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
            <Link 
              to="/" 
              className="py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start
            </Link>
            <Link 
              to="/archiwum" 
              className="py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Archiwum
            </Link>
            {user && (
              <Link 
                to="/moje-typy" 
                className="py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Moje Typy
              </Link>
            )}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="py-2 text-sm font-medium text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            <div className="border-t border-border pt-3 mt-2">
              {user ? (
                <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Wyloguj
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                    Zaloguj się
                  </Button>
                  <Button variant="neon" size="sm" className="w-full" onClick={() => { navigate('/auth?mode=signup'); setMobileMenuOpen(false); }}>
                    Dołącz teraz
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
