import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { webhooks } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";

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

// 更新Webhook请求验证
const webhookUpdateSchema = z.object({
  url: z.string().refine(isValidUrl, { message: "必须是有效的URL" }).optional(),
  events: z.array(z.enum(validEventTypes as [string, ...string[]])).min(1, { message: "至少需要一个事件类型" }).optional(),
  description: z.string().optional(),
  active: z.boolean().optional()
});

// 获取单个Webhook (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const webhookId = params.id;

    // 从数据库获取Webhook
    const webhook = await db.select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    if (!webhook || webhook.length === 0) {
      return NextResponse.json({ error: "Webhook不存在" }, { status: 404 });
    }

    // 格式化响应
    const formattedWebhook = {
      ...webhook[0],
      // 不返回完整的secret
      secret: webhook[0].secret ? `${webhook[0].secret.substring(0, 8)}...` : null
    };

    return NextResponse.json(formattedWebhook);

  } catch (error) {
    console.error("获取Webhook失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 更新Webhook (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const webhookId = params.id;
    
    // 检查Webhook是否存在
    const existingWebhook = await db.select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existingWebhook || existingWebhook.length === 0) {
      return NextResponse.json({ error: "Webhook不存在" }, { status: 404 });
    }

    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const result = webhookUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }

    const { url, events, description, active } = result.data;

    // 构建更新数据
    const updateData: Partial<typeof webhooks.$inferInsert> = {
      updatedAt: new Date()
    };

    if (url !== undefined) {
      updateData.url = url;
    }

    if (events !== undefined) {
      updateData.events = events;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    // 执行更新
    await db.update(webhooks)
      .set(updateData)
      .where(
        and(
          eq(webhooks.id, webhookId),
          eq(webhooks.userId, session.user.id)
        )
      );

    // 获取更新后的Webhook
    const updatedWebhook = await db.select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    // 格式化响应
    const formattedWebhook = {
      ...updatedWebhook[0],
      // 不返回完整的secret
      secret: updatedWebhook[0].secret ? `${updatedWebhook[0].secret.substring(0, 8)}...` : null
    };

    return NextResponse.json(formattedWebhook);

  } catch (error) {
    console.error("更新Webhook失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 删除Webhook (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const webhookId = params.id;

    // 检查Webhook是否存在
    const existingWebhook = await db.select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existingWebhook || existingWebhook.length === 0) {
      return NextResponse.json({ error: "Webhook不存在" }, { status: 404 });
    }

    // 删除Webhook
    await db.delete(webhooks)
      .where(
        and(
          eq(webhooks.id, webhookId),
          eq(webhooks.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("删除Webhook失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
} 