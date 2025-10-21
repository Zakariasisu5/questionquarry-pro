import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Upload, Star, Shield, LogOut, LogIn, User, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import udsLogo from "@/assets/logo.jpg";

export const Navigation = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Upload, label: "Upload Resource", path: "/upload" },
    { icon: Star, label: "My Bookmarks", path: "/bookmarks" },
    { icon: Shield, label: "Admin Panel", path: "/admin" },
    { icon: Info, label: "About", path: "/about" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
      toast({ title: 'Signed out', description: 'You have been signed out', variant: 'default' });
      navigate('/');
    } catch (err) {
      console.error('Sign out failed', err);
      toast({ title: 'Sign out failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <img src={udsLogo} alt="UDS Logo" className="h-12 w-12" />
            <div>
              <h2 className="text-lg font-bold">UDS StudyHub</h2>
              <p className="text-xs text-muted-foreground">Academic Resources</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="w-full justify-start h-12 text-base"
                  onClick={() => handleNavigate(item.path)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t pt-4">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{user.email}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={() => handleNavigate("/auth")}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-muted-foreground text-center">
              UDS StudyHub v1.0
              <br />
              Made for students, by students
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
function toast(arg0: { title: string; description: string; variant: string; }) {
  throw new Error("Function not implemented.");
}

