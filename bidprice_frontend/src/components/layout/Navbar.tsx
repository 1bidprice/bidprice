import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Home, Package, User, LogOut, LogIn, UserPlus, Tag } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 py-3 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center relative">
            <div className="relative">
              <img 
                src="/images/logo.png" 
                alt="BidPrice.gr Logo" 
                className="h-12 mr-2 relative z-10" 
              />
              <div className="absolute inset-0 bg-radial-fade pointer-events-none z-20"></div>
            </div>
            <span className="sr-only">BidPrice.gr</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="flex items-center text-gray-700 hover:text-green-600 font-medium">
              <Home className="mr-1.5 h-4 w-4" />
              Αρχική
            </Link>
            <Link to="/products" className="flex items-center text-gray-700 hover:text-green-600 font-medium">
              <Package className="mr-1.5 h-4 w-4" />
              Προϊόντα
            </Link>
            <Link to="/products/new" className="flex items-center text-gray-700 hover:text-green-600 font-medium">
              <Tag className="mr-1.5 h-4 w-4" />
              Νέα Δημοπρασία
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {user?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Προφίλ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products/new" className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Νέο Προϊόν
                  </Link>
                </DropdownMenuItem>
                {user?.is_admin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Διαχείριση
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} className="flex items-center text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Αποσύνδεση
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" asChild className="border-gray-300 hover:bg-gray-50 hover:text-green-600">
                <Link to="/login" className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Σύνδεση
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <Link to="/register" className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Εγγραφή
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
