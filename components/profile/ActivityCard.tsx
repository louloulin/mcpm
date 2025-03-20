"use client"

import { formatDistance } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Heart, MessageSquare, Server, GitFork, Star, Bookmark } from "lucide-react"

type ActivityType = "server_created" | "server_favorite" | "server_comment" | "server_fork" | "profile_update" | "server_star"

interface ActivityProps {
  id: string
  type: ActivityType
  timestamp: string
  user: {
    id: string
    name: string
    avatarUrl?: string
  }
  data: {
    serverId?: string
    serverName?: string
    comment?: string
    profileField?: string
  }
}

const ActivityIcons: Record<ActivityType, React.ReactNode> = {
  server_created: <Server className="h-5 w-5 text-green-500" />,
  server_favorite: <Heart className="h-5 w-5 text-red-500" />,
  server_comment: <MessageSquare className="h-5 w-5 text-blue-500" />,
  server_fork: <GitFork className="h-5 w-5 text-purple-500" />,
  profile_update: <Avatar className="h-5 w-5 border-2 border-yellow-500" />,
  server_star: <Star className="h-5 w-5 text-yellow-500" />
}

const ActivityTitle: Record<ActivityType, string> = {
  server_created: "创建了新服务器",
  server_favorite: "收藏了服务器",
  server_comment: "评论了服务器",
  server_fork: "派生了服务器",
  profile_update: "更新了个人资料",
  server_star: "标星了服务器"
}

export default function ActivityCard({ type, timestamp, user, data }: ActivityProps) {
  const relativeTime = formatDistance(new Date(timestamp), new Date(), { addSuffix: true })
  
  return (
    <Card className="mb-4 overflow-hidden border-border/40 hover:border-border/80 transition-all">
      <CardHeader className="p-4 pb-0 flex flex-row items-center gap-4">
        <div className="flex items-center justify-center rounded-full w-10 h-10 bg-muted">
          {ActivityIcons[type]}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{user.name}</span>
            <Badge variant="outline" className="text-xs font-normal">
              {ActivityTitle[type]}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            {relativeTime}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {type === "server_created" && (
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`/servers/${data.serverId}`} 
              className="text-sm font-medium hover:underline"
            >
              {data.serverName}
            </a>
          </div>
        )}
        
        {type === "server_comment" && (
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="line-clamp-2">{data.comment}</p>
            {data.serverName && (
              <a 
                href={`/servers/${data.serverId}`} 
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                在 {data.serverName} 上的评论
              </a>
            )}
          </div>
        )}
        
        {type === "profile_update" && (
          <p className="text-sm">
            更新了 <span className="font-medium">{data.profileField}</span>
          </p>
        )}
        
        {(type === "server_favorite" || type === "server_fork" || type === "server_star") && (
          <div className="flex items-center gap-2">
            {type === "server_favorite" && <Bookmark className="h-4 w-4 text-muted-foreground" />}
            {type === "server_fork" && <GitFork className="h-4 w-4 text-muted-foreground" />}
            {type === "server_star" && <Star className="h-4 w-4 text-muted-foreground" />}
            {data.serverName && (
              <a 
                href={`/servers/${data.serverId}`} 
                className="text-sm hover:underline"
              >
                {data.serverName}
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 