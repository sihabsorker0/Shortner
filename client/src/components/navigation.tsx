import { Link, ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navigation() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <Link className="text-primary mr-2" size={24} />
                SihabShort
              </h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <a 
                  href="#dashboard" 
                  className="text-slate-900 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </a>
                <a 
                  href="#analytics" 
                  className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Analytics
                </a>
                <a 
                  href="#api" 
                  className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  API
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-slate-500 hover:text-slate-900"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu size={18} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
