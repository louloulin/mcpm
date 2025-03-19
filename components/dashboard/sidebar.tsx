'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Server, 
  Settings, 
  BarChart3,
  PackageOpen,
  Users,
  HelpCircle
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };
  
  const navItems = [
    { name: '仪表盘', href: '/dashboard', icon: Home },
    { name: '我的服务器', href: '/dashboard/servers', icon: Server },
    { name: '统计数据', href: '/dashboard/stats', icon: BarChart3 },
    { name: '设置', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 md:shadow transform -translate-x-full md:translate-x-0 transition-transform duration-150 ease-in bg-white md:bg-transparent">
      <div className="md:sticky md:top-16 overflow-y-auto h-screen pb-12 pt-4 px-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-4 py-2 text-sm font-medium rounded-md
                ${isActive(item.href) 
                  ? 'text-blue-700 bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <item.icon 
                className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-blue-500' : 'text-gray-500'}`} 
              />
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="mt-10">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            帮助 & 资源
          </h3>
          <div className="mt-2 space-y-1">
            <Link
              href="/docs"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <HelpCircle className="mr-3 h-5 w-5 text-gray-500" />
              文档
            </Link>
            <Link
              href="/browse"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <PackageOpen className="mr-3 h-5 w-5 text-gray-500" />
              服务器市场
            </Link>
            <Link
              href="/enterprise"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <Users className="mr-3 h-5 w-5 text-gray-500" />
              企业方案
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
} 