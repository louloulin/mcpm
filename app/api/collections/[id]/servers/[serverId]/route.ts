import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { collectionServers, serverCollections } from '@/lib/database/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';

/**
 * @swagger
 * /collections/{id}/servers/{serverId}:
 *   delete:
 *     summary: 从集合中移除服务器
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
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: string
 *         description: 服务器ID
 *     responses:
 *       200:
 *         description: 服务器已从集合中移除
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; serverId: string } }
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
    const { id, serverId } = params;

    // 查询集合是否存在并验证用户权限
    const collection = await db.query.serverCollections.findFirst({
      where: eq(serverCollections.id, id),
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

    // 检查服务器是否在集合中
    const serverInCollection = await db.query.collectionServers.findFirst({
      where: and(
        eq(collectionServers.collectionId, id),
        eq(collectionServers.serverId, serverId)
      ),
    });

    if (!serverInCollection) {
      return NextResponse.json(
        { message: '服务器不在此集合中' },
        { status: 404 }
      );
    }

    // 从集合中移除服务器
    await db.delete(collectionServers)
      .where(
        and(
          eq(collectionServers.collectionId, id),
          eq(collectionServers.serverId, serverId)
        )
      );

    // 重新排序剩余服务器
    const remainingServers = await db.query.collectionServers.findMany({
      where: eq(collectionServers.collectionId, id),
      orderBy: (servers, { asc }) => [asc(servers.order)],
    });

    // 更新剩余服务器的顺序
    for (let i = 0; i < remainingServers.length; i++) {
      await db.update(collectionServers)
        .set({ order: i })
        .where(
          and(
            eq(collectionServers.collectionId, id),
            eq(collectionServers.serverId, remainingServers[i].serverId)
          )
        );
    }

    return NextResponse.json({ message: '服务器已从集合中移除' });
  } catch (error) {
    console.error('从集合中移除服务器时出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
} 