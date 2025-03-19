import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Server } from '@/lib/database/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Star, Download, Clock } from 'lucide-react';

interface DashboardPreferences {
  showRecentlyViewed: boolean;
  showFavorites: boolean;
  showDownloads: boolean;
  showRatings: boolean;
}

interface DashboardStats {
  recentlyViewed: Server[];
  favorites: Server[];
  downloads: Server[];
  ratings: Server[];
}

export default function PersonalizedDashboard() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    showRecentlyViewed: true,
    showFavorites: true,
    showDownloads: true,
    showRatings: true
  });
  const [stats, setStats] = useState<DashboardStats>({
    recentlyViewed: [],
    favorites: [],
    downloads: [],
    ratings: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      // 加载用户偏好设置
      loadPreferences();
      // 加载仪表盘数据
      loadDashboardData();
    }
  }, [session]);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        recentlyViewedRes,
        favoritesRes,
        downloadsRes,
        ratingsRes
      ] = await Promise.all([
        fetch('/api/user/recently-viewed'),
        fetch('/api/user/favorites'),
        fetch('/api/user/downloads'),
        fetch('/api/user/ratings')
      ]);

      const [
        recentlyViewed,
        favorites,
        downloads,
        ratings
      ] = await Promise.all([
        recentlyViewedRes.json(),
        favoritesRes.json(),
        downloadsRes.json(),
        ratingsRes.json()
      ]);

      setStats({
        recentlyViewed,
        favorites,
        downloads,
        ratings
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = async (key: keyof DashboardPreferences) => {
    try {
      const newPreferences = {
        ...preferences,
        [key]: !preferences[key]
      };

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        setPreferences(newPreferences);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  if (!session) {
    return (
      <div className="text-center py-8">
        <p>请登录以查看个性化仪表盘</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">个性化仪表盘</h2>
        <Button variant="outline" size="sm" onClick={() => {}}>
          <Settings className="h-4 w-4 mr-2" />
          自定义
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recently Viewed */}
        {preferences.showRecentlyViewed && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">最近查看</h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {stats.recentlyViewed.map(server => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                >
                  <span>{server.name}</span>
                  <span className="text-sm text-gray-500">{server.version}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Favorites */}
        {preferences.showFavorites && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">收藏</h3>
              <Star className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {stats.favorites.map(server => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                >
                  <span>{server.name}</span>
                  <span className="text-sm text-gray-500">{server.version}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Downloads */}
        {preferences.showDownloads && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">下载</h3>
              <Download className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {stats.downloads.map(server => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                >
                  <span>{server.name}</span>
                  <span className="text-sm text-gray-500">
                    下载次数: {server.downloads}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Ratings */}
        {preferences.showRatings && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">评分</h3>
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="space-y-2">
              {stats.ratings.map(server => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                >
                  <span>{server.name}</span>
                  <span className="text-sm text-gray-500">
                    评分: {server.rating}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 