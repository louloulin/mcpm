import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { recommendationService } from "@/lib/api/services/RecommendationService";

const getRecommendationsSchema = z.object({
  limit: z.coerce.number().optional().default(10),
});

/**
 * 获取针对当前用户的服务器推荐
 */
export async function GET(req: Request) {
  try {
    // 1. 验证用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "未授权访问" },
        { status: 401 }
      );
    }

    // 2. 解析查询参数
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    
    const parsed = getRecommendationsSchema.safeParse({
      limit: limitParam || 10,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "无效的请求参数", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    // 3. 获取推荐
    const recommendations = await recommendationService.getRecommendationsForUser(
      session.user.id,
      parsed.data.limit
    );

    // 4. 返回结果
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("获取推荐时出错:", error);
    return NextResponse.json(
      { message: "获取推荐时发生错误" },
      { status: 500 }
    );
  }
} 