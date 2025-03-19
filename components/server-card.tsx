import Link from 'next/link';
import { Server } from '../lib/api-client';
import { formatRelativeTime, truncateString } from '../lib/utils';
import { User, Download, Star, Tag } from 'lucide-react';

interface ServerCardProps {
  server: Server;
}

const ServerCard = ({ server }: ServerCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/servers/${server.key}`} className="block h-full">
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {server.name}
            </h3>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
              v{server.version}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 flex-grow">
            {truncateString(server.description, 120)}
          </p>
          
          {server.tags && server.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {server.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
              {server.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{server.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500 pt-3 border-t">
            <div className="flex items-center mr-4">
              <Download className="h-4 w-4 mr-1" />
              <span>{server.downloads.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center mr-4">
              <Star className="h-4 w-4 mr-1 text-amber-500" />
              <span>{server.rating.toFixed(1)}</span>
            </div>
            
            <div className="flex items-center ml-auto text-xs text-gray-400">
              <span>{formatRelativeTime(server.updatedAt)}</span>
            </div>
          </div>
          
          {server.author && (
            <div className="flex items-center mt-3 text-xs text-gray-500">
              <User className="h-3 w-3 mr-1" />
              <span>由 {server.author.username} 发布</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ServerCard; 