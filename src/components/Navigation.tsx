import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Upload, Star, Shield, BookOpen } from "lucide-react";

export const Navigation = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Upload, label: "Upload Resource", path: "/upload" },
    { icon: Star, label: "My Bookmarks", path: "/bookmarks" },
    { icon: Shield, label: "Admin Panel", path: "/admin" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
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
            <BookOpen className="h-8 w-8 text-primary" />
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
