import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { serverCollections, collectionServers, servers } from '@/lib/database/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { and, eq, desc, max } from 'drizzle-orm';
import { z } from 'zod';

// 验证添加服务器到集合的请求
const addServerSchema = z.object({
  serverId: z.string().uuid()
});

// 验证更新集合中服务器顺序的请求
const updateOrderSchema = z.object({
  servers: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0)
    })
  )
});

/**
 * @swagger
 * /collections/{id}/servers:
 *   post:
 *     summary: 添加服务器到集合
 *     tags: [collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 集合ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serverId
 *             properties:
 *               serverId:
 *                 type: string
 *                 format: uuid
 *                 description: 要添加的服务器ID
 *     responses:
 *       201:
 *         description: 服务器已添加到集合
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 collectionId:
 *                   type: string
 *                 serverId:
 *                   type: string
 *                 order:
 *                   type: integer
 *       400:
 *         description: 无效的请求数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 无权操作此集合
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 集合或服务器不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 服务器已在集合中
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: '需要登录才能执行此操作' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = params;

    // 解析和验证请求数据
    const body = await req.json();
    const validationResult = addServerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: '无效的请求数据', 
          errors: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    const { serverId } = validationResult.data;

    // 验证集合存在并检查权限
    const collection = await db.query.serverCollections.findFirst({
      where: eq(serverCollections.id, id)
    });

    if (!collection) {
      return NextResponse.json(
        { message: '集合不存在' },
        { status: 404 }
      );
    }

    // 检查权限
    if (collection.createdBy !== userId) {
      return NextResponse.json(
        { message: '无权操作此集合' },
        { status: 403 }
      );
    }

    // 验证服务器是否存在
    const server = await db.query.servers.findFirst({
      where: eq(servers.id, serverId)
    });

    if (!server) {
      return NextResponse.json(
        { message: '服务器不存在' },
        { status: 404 }
      );
    }

    // 检查服务器是否已在集合中
    const existingRelation = await db.query.collectionServers.findFirst({
      where: and(
        eq(collectionServers.collectionId, id),
        eq(collectionServers.serverId, serverId)
      )
    });

    if (existingRelation) {
      return NextResponse.json(
        { message: '服务器已在此集合中' },
        { status: 409 }
      );
    }

    // 获取当前最大顺序值
    const [maxOrderResult] = await db
      .select({ value: max(collectionServers.order) })
      .from(collectionServers)
      .where(eq(collectionServers.collectionId, id));
      
    const maxOrder = maxOrderResult?.value ?? -1;
    const newOrder = maxOrder + 1;

    // 添加服务器到集合
    const [relation] = await db.insert(collectionServers)
      .values({
        collectionId: id,
        serverId,
        order: newOrder,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(relation, { status: 201 });
  } catch (error) {
    console.error('添加服务器到集合时出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /collections/{id}/servers:
 *   patch:
 *     summary: 更新集合中服务器的顺序
 *     tags: [collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 集合ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - servers
 *             properties:
 *               servers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - order
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 服务器顺序已更新
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: 无效的请求数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 无权操作此集合
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 集合不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: '需要登录才能执行此操作' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = params;

    // 验证集合存在并检查权限
    const collection = await db.query.serverCollections.findFirst({
      where: eq(serverCollections.id, id)
    });

    if (!collection) {
      return NextResponse.json(
        { message: '集合不存在' },
        { status: 404 }
      );
    }

    // 检查权限
    if (collection.createdBy !== userId) {
      return NextResponse.json(
        { message: '无权操作此集合' },
        { status: 403 }
      );
    }

    // 解析和验证请求数据
    const body = await req.json();
    const validationResult = updateOrderSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: '无效的请求数据', 
          errors: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    const { servers: serversList } = validationResult.data;

    // 批量更新服务器顺序
    for (const item of serversList) {
      await db.update(collectionServers)
        .set({ order: item.order })
        .where(
          and(
            eq(collectionServers.collectionId, id),
            eq(collectionServers.serverId, item.id)
          )
        );
    }

    return NextResponse.json({ message: '服务器顺序已更新' });
  } catch (error) {
    console.error('更新服务器顺序时出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
} 