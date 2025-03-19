import Link from 'next/link';
import { Badge } from './ui/badge';
import { ExternalLinkIcon, Download } from 'lucide-react';
import { Button } from './ui/button';

export interface ServerCardProps {
  server: {
    key: string;
    name?: string;
    description?: string;
    command?: string;
    homepage?: string;
    tags?: string[];
    downloads?: number;
  };
}

export default function ServerCard({ server }: ServerCardProps) {
  const { key, name, description, homepage, tags = [], downloads = 0 } = server;
  const displayName = name || key;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            <Link href={`/servers/${key}`} className="hover:underline">
              {displayName}
            </Link>
          </h3>
          {homepage && (
            <a 
              href={homepage} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLinkIcon size={16} />
              <span className="sr-only">项目主页</span>
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description || '暂无描述'}
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {downloads} 次下载
          </div>
          <Link href={`/servers/${key}`}>
            <Button size="sm" className="gap-1">
              <Download size={14} />
              安装
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 