import { ServerRecommendationList } from "@/components/server/ServerRecommendationList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RecommendationsSection() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>为您推荐</CardTitle>
        <CardDescription>
          根据您的兴趣和使用历史推荐的服务器
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">全部推荐</TabsTrigger>
            <TabsTrigger value="similar">相似用户喜欢</TabsTrigger>
            <TabsTrigger value="trending">热门趋势</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <ServerRecommendationList limit={5} />
          </TabsContent>
          <TabsContent value="similar">
            <ServerRecommendationList limit={3} />
          </TabsContent>
          <TabsContent value="trending">
            <ServerRecommendationList limit={3} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 