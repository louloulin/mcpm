"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { 
  Menu, 
  Search, 
  Bell, 
  Upload, 
  User, 
  LogOut, 
  Server, 
  Settings,
  X 
} from "lucide-react"

interface NavbarProps {
  user?: {
    id: string
    name: string
    email: string
    image?: string
  }
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // 检查路径是否匹配
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }
  
  // 导航链接
  const navLinks = [
    { href: "/", label: "首页" },
    { href: "/servers", label: "浏览服务器" },
    { href: "/docs", label: "文档" },
    { href: "/pricing", label: "价格" },
  ]

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* 移动端搜索输入框 */}
        {isSearching ? (
          <div className="absolute inset-0 z-50 flex items-center bg-background px-4 h-16">
            <Input
              type="search"
              placeholder="搜索服务器..."
              className="flex-1 h-10"
              autoFocus
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2" 
              onClick={() => setIsSearching(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">关闭搜索</span>
            </Button>
          </div>
        ) : (
          <>
            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">打开菜单</span>
            </Button>
            
            {/* Logo */}
            <div className="mr-4 flex">
              <Link href="/" className="flex items-center space-x-2">
                <Server className="h-6 w-6" />
                <span className="hidden font-bold sm:inline-block">
                  MCP Cloud
                </span>
              </Link>
            </div>
            
            {/* 桌面端导航链接 */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive(link.href)
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            {/* 搜索按钮 (移动端) */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearching(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">搜索</span>
            </Button>
            
            {/* 搜索输入框 (桌面端) */}
            <div className="hidden md:flex md:flex-1 items-center justify-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索服务器..."
                  className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-auto">
              {/* 通知 */}
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">通知</span>
              </Button>
              
              {/* 上传按钮 */}
              <Link href="/upload">
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Upload className="h-5 w-5" />
                  <span className="sr-only">上传</span>
                </Button>
              </Link>
              
              {/* 主题切换 */}
              <ModeToggle />
              
              {/* 用户菜单 */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>个人资料</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <Server className="mr-2 h-4 w-4" />
                        <span>我的服务器</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>设置</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button size="sm">登录</Button>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container flex flex-col space-y-3 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex w-full items-center py-2 text-sm font-medium",
                  isActive(link.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/upload"
              className="flex w-full items-center py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Upload className="mr-2 h-4 w-4" />
              上传服务器
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 