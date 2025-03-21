import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/database";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import crypto from 'crypto';
import { webhooks, type NewWebhook } from '@/lib/database/schema';
import { eq, sql } from 'drizzle-orm';

// URL validation function
function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Webhook事件类型
const validEventTypes = [
  "server.created",
  "server.updated",
  "server.deleted",
  "server.published",
  "server.version.released",
  "user.registered",
  "user.updated",
  "installation.created",
  "installation.updated",
  "installation.deleted"
];

// 创建Webhook请求验证
const webhookCreateSchema = z.object({
  url: z.string().refine(isValidUrl, { message: "必须是有效的URL" }),
  events: z.array(z.enum(validEventTypes as [string, ...string[]])).min(1, { message: "至少需要一个事件类型" }),
  description: z.string().optional()
});

/**
 * 获取所有Webhooks
 */
export async function GET(request: NextRequest) {
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 从数据库获取Webhooks
    const [{ count }] = await db.select({ 
      count: sql<number>`COUNT(*)::int`
    })
      .from(webhooks)
      .where(eq(webhooks.userId, session.user.id));
    
    const userWebhooks = await db.select()
      .from(webhooks)
      .where(eq(webhooks.userId, session.user.id))
      .limit(limit)
      .offset(offset);

    // 格式化响应
    const formattedWebhooks = userWebhooks.map(webhook => ({
      ...webhook,
      // 不返回完整的secret
      secret: webhook.secret ? `${webhook.secret.substring(0, 8)}...` : null
    }));

    return NextResponse.json({
      data: formattedWebhooks,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error("获取Webhooks失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/**
 * 创建新的Webhook
 */
export async function POST(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const result = webhookCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }

    const { url, events, description } = result.data;

    // 生成Webhook密钥
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    
    // 插入Webhook到数据库
    const now = new Date();
    const webhookId = `webhook-${uuidv4()}`;

    const newWebhook: NewWebhook = {
      id: webhookId,
      userId: session.user.id,
      url,
      events,
      description: description || null,
      secret,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    await db.insert(webhooks).values(newWebhook);

    // 返回创建的Webhook
    return NextResponse.json({
      id: webhookId,
      url,
      events,
      description: description || null,
      secret, // 只在创建时返回完整密钥
      active: true,
      created_at: now,
      updated_at: now
    }, { status: 201 });

  } catch (error) {
    console.error("创建Webhook失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
} 