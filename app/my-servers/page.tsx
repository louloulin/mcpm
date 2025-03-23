'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MyServersPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到dashboard/servers页面
    router.push('/dashboard/servers');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
        <p className="mt-4 text-gray-500">正在跳转到服务器管理页面...</p>
      </div>
    </div>
  );
}
