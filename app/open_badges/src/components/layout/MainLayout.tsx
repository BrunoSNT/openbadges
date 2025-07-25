import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeToggle } from '../theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Check if current route requires wallet connection
function isProtectedRoute(pathname: string): boolean {
  // Only protect write operations and user-specific pages
  const protectedRoutes = [
    '/profile',
    '/profile-management',
    '/achievements/new',
    '/achievements/edit/',
    '/badges/issue',
    '/badges/new',
    '/badges/edit/',
    '/api/' // Protect API routes
  ];
  
  // Check if current path starts with any protected route
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Special case: viewing a specific achievement or badge is public
  const isPublicView = (
    pathname.match(/^\/achievements\/[^/]+$/) ||
    pathname.match(/^\/badges\/[^/]+$/)
  );
  
  return isProtected && !isPublicView;
}

// Component to show when wallet is required but not connected
function WalletRequired({ onConnect }: { onConnect: () => void }) {
  const { pathname } = useLocation();
  const { tWallet } = useTranslation();
  
  // Get the current action for the message
  const getActionText = () => {
    if (pathname.startsWith('/profile-management')) return tWallet('actions.manageProfile');
    if (pathname.startsWith('/achievements/new')) return tWallet('actions.createAchievement');
    if (pathname.startsWith('/badges/issue')) return tWallet('actions.issueBadge');
    if (pathname.startsWith('/badges/new')) return tWallet('actions.createBadge');
    if (pathname.startsWith('/profile')) return tWallet('actions.viewProfile');
    return tWallet('actions.performAction');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{tWallet('required')}</CardTitle>
          <CardDescription>
            {tWallet('requiredDescription', { action: getActionText() })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={onConnect} className="gap-2">
            <span>{tWallet('connect')}</span>
          </Button>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground justify-center">
          {tWallet('signMessage')}
        </CardFooter>
      </Card>
    </div>
  );
}

// Component to handle wallet connection state for protected routes
function WalletContentGuard({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { connected, connecting } = useWallet();
  const [showConnect, setShowConnect] = useState(false);

  // Show connect UI after a short delay to prevent flash of content
  useEffect(() => {
    const timer = setTimeout(() => setShowConnect(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Skip wallet check for public routes
  if (!isProtectedRoute(pathname)) {
    return <>{children}</>;
  }

  if (connecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!connected) {
    return showConnect ? (
      <WalletRequired onConnect={() => {/* WalletMultiButton handles the connection */}} />
    ) : (
      <div className="h-32" /> // Prevent layout shift
    );
  }

  return <>{children}</>;
}

export function MainLayout() {
  const { tNav, tLayout } = useTranslation();
  
  const navItems = [
    { name: tNav('home'), path: '/' },
    { name: tNav('dashboard'), path: '/dashboard' },
    { name: tNav('achievements'), path: '/achievements' },
    { name: tNav('badges'), path: '/badges' },
    { name: tNav('validate'), path: '/validate' },
    { name: tNav('profile'), path: '/profile' },
    { name: tNav('docs'), path: '/docs' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-8">
              <NavLink to="/" className="text-2xl font-bold">
                {tLayout('appTitle')}
              </NavLink>
              <nav className="hidden space-x-6 lg:flex">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'text-sm font-medium transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="wallet-button-container">
                <WalletMultiButton />
              </div>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className="container px-8 py-8 w-full max-w-8xl flex-1 self-center">
        <div className="w-full">
          <WalletContentGuard>
            <Outlet />
          </WalletContentGuard>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {tLayout('footer.copyright')}
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {tLayout('footer.privacy')}
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {tLayout('footer.terms')}
              </a>
              <a href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {tLayout('footer.documentation')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
