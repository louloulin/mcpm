import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { webhooks } from "@/lib/database/schema";
import { sql } from "drizzle-orm";

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

// 触发事件验证
const eventTriggerSchema = z.object({
  event_type: z.enum(validEventTypes as [string, ...string[]]),
  payload: z.record(z.any()).optional()
});

/**
 * 触发Webhook事件
 * 在实际应用中，这个API应该受到严格控制，通常只能被管理员或系统内部调用
 * 这里提供的实现是为了测试和演示目的
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
    const result = eventTriggerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }

    const { event_type, payload = {} } = result.data;

    // 获取订阅了该事件类型的所有活跃Webhooks
    const activeWebhooks = await db.select()
      .from(webhooks)
      .where(
        sql`${webhooks.active} = true AND ${webhooks.events}::text[] @> ARRAY[${event_type}]::text[]`
      );

    if (!activeWebhooks || activeWebhooks.length === 0) {
      return NextResponse.json({ 
        message: "没有可触发的Webhook",
        triggered: 0
      });
    }

    // 生成事件ID
    const eventId = `evt_${uuidv4()}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // 准备事件负载
    const eventPayload = {
      id: eventId,
      type: event_type,
      created_at: new Date().toISOString(),
      data: payload
    };

    const jsonPayload = JSON.stringify(eventPayload);

    // 计划触发每个Webhook
    // 注意：在生产环境中，这应该使用消息队列或后台作业处理，以避免阻塞请求
    const triggerPromises = activeWebhooks.map(async (webhook) => {
      try {
        // 计算签名
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(jsonPayload)
          .digest('hex');

        // 发送Webhook请求
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MCPM-Signature': `sha256=${signature}`,
            'X-MCPM-Timestamp': `${timestamp}`,
            'X-MCPM-Event-Id': eventId
          },
          body: jsonPayload
        });

        return {
          webhook_id: webhook.id,
          status: response.status,
          success: response.ok
        };
      } catch (error) {
        console.error(`触发Webhook ${webhook.id} 失败:`, error);
        return {
          webhook_id: webhook.id,
          status: 0,
          success: false,
          error: (error as Error).message
        };
      }
    });

    // 等待所有Webhook触发完成
    const results = await Promise.all(triggerPromises);

    // 返回结果
    return NextResponse.json({
      event_id: eventId,
      event_type,
      triggered: results.length,
      results
    });

  } catch (error) {
    console.error("触发Webhook事件失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
} 