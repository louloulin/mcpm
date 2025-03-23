'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// 导航项目类型
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

// 导航分组类型
interface NavGroup {
  title: string;
  items: NavItem[];
}

// 图标组件 - 简化版
const Icons = {
  Dashboard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Servers: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12.5h14M5 12.5a2.5 2.5 0 0 1-2.5-2.5V5a2.5 2.5 0 0 1 2.5-2.5h14A2.5 2.5 0 0 1 21.5 5v5a2.5 2.5 0 0 1-2.5 2.5M5 12.5a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 2.5 2.5h14a2.5 2.5 0 0 0 2.5-2.5v-4a2.5 2.5 0 0 0-2.5-2.5M8 8.5h.01M8 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Analytics: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 7v11m4-8v8m4-4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Settings: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Profile: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

export default function SideNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // 定义导航组
  const navGroups: NavGroup[] = [
    {
      title: '主要',
      items: [
        {
          title: '仪表盘',
          href: '/dashboard',
          icon: <Icons.Dashboard />
        },
        {
          title: '我的服务器',
          href: '/dashboard/servers',
          icon: <Icons.Servers />
        },
        {
          title: '分析',
          href: '/dashboard/analytics',
          icon: <Icons.Analytics />
        }
      ]
    },
    {
      title: '账户',
      items: [
        {
          title: '个人资料',
          href: '/dashboard/profile',
          icon: <Icons.Profile />
        },
        {
          title: '设置',
          href: '/dashboard/settings',
          icon: <Icons.Settings />
        }
      ]
    }
  ];

  return (
    <aside className="w-64 h-full bg-card border-r border-border overflow-y-auto flex-shrink-0">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">服务器管理</h2>
        </div>
        
        {/* 用户信息 */}
        {user && (
          <div className="mb-6 p-3 bg-muted rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="ml-3">
                <p className="font-medium text-foreground">{user.name || '用户'}</p>
                <p className="text-xs text-muted-foreground">{user.role || 'user'}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 导航菜单 */}
        <nav className="space-y-6">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{group.title}</h3>
              <ul className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  
                  return (
                    <li key={itemIndex}>
                      <Link 
                        href={item.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm ${
                          isActive 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <span className={`mr-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {item.icon}
                        </span>
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
} 