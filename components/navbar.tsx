import Link from 'next/link';
import { Button } from './ui/button';
import { 
  HomeIcon, 
  SearchIcon, 
  BookIcon,
  LayoutDashboardIcon,
  UserIcon 
} from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="MCPR Logo" className="h-8 w-8" />
            <span className="font-bold text-xl">MCPR</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-10">
            <Link 
              href="/" 
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
            >
              <HomeIcon size={16} />
              首页
            </Link>
            <Link 
              href="/browse" 
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
            >
              <SearchIcon size={16} />
              浏览
            </Link>
            <Link 
              href="/docs" 
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
            >
              <BookIcon size={16} />
              文档
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="mr-2">
              <LayoutDashboardIcon size={18} />
              <span className="sr-only">控制面板</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="px-4">
              <UserIcon size={16} className="mr-2" />
              登录
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="px-4">
              注册
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
} 