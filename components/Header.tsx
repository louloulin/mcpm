import React from 'react';
import NextLink from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from 'next/link';
import { Notifications } from '@/components/layout/Notifications';

const NavLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <Link 
    href={href}
    className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
  >
    {children}
  </Link>
);

export default function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px]">
                <nav className="flex flex-col space-y-4 mt-6">
                  <NavLink href="/servers">服务器</NavLink>
                  <NavLink href="/dashboard">仪表盘</NavLink>
                  <NavLink href="/documentation">文档</NavLink>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center space-x-8">
            <NextLink href="/" passHref>
              <span className="cursor-pointer font-bold text-xl">MCPM Cloud</span>
            </NextLink>
            
            <nav className="hidden md:flex items-center space-x-4">
              <NavLink href="/servers">服务器</NavLink>
              <NavLink href="/dashboard">仪表盘</NavLink>
              <NavLink href="/documentation">文档</NavLink>
            </nav>
          </div>
          
          <div className="flex items-center">
            <Notifications />
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="ml-2 mr-2">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-8 w-8">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem>个人信息</DropdownMenuItem>
                  <DropdownMenuItem>设置</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 