'use client';

import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-card shadow-soft-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-primary mr-2"
              >
                <path d="M22 8a.76.76 0 0 0 0-.21v-.08a.77.77 0 0 0-.07-.16.35.35 0 0 0-.05-.08l-.1-.13-.08-.06-.12-.09-9-5a1 1 0 0 0-1 0l-9 5-.09.07-.11.08a.41.41 0 0 0-.09.11l-.06.14a.6.6 0 0 0-.06.18A.76.76 0 0 0 2 8v8a1 1 0 0 0 .52.87l9 5a.75.75 0 0 0 .13.06h.1a1.06 1.06 0 0 0 .5 0h.1l.14-.06 9-5A1 1 0 0 0 22 16V8z"></path>
                <path d="M12 22V12"></path>
                <path d="M12 12 2.5 6.5"></path>
                <path d="m12 12 9.5-5.5"></path>
              </svg>
              <span className="text-xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Certificate Generator</span>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center">
              <div className="hidden md:flex-shrink-0 md:flex md:items-center space-x-1">
                <span className="text-sm text-muted-foreground mr-2">
                  Welcome, {user.name}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-expanded={isMenuOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border rounded-xl bg-card shadow-soft-xl ring-1 ring-primary/5 focus:outline-none animate-fade-in"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.username}</p>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          role="menuitem"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile menu */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors"
                  aria-expanded={isMenuOpen}
                >
                  <span className="sr-only">Open menu</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {isMenuOpen && (
                  <div className="absolute top-16 inset-x-0 p-2 transition transform origin-top-right md:hidden z-50">
                    <div className="rounded-xl shadow-soft-xl bg-card border border-border overflow-hidden animate-slide-down">
                      <div className="pt-4 pb-3 px-5">
                        <div className="flex items-center px-1">
                          <div className="mr-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <div className="text-base font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.username}</div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-border">
                        <div className="py-2 px-3">
                          <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-3 rounded-lg w-full text-left text-sm hover:bg-muted transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                              <polyline points="16 17 21 12 16 7"></polyline>
                              <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 