import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { serverCollections } from '@/lib/database/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// 集合更新验证模式
const updateCollectionSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  coverImage: z.string().url().optional().nullable(),
});

/**
 * @swagger
 * /collections/{id}:
 *   get:
 *     summary: 获取集合详情
 *     tags: [collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 集合ID
 *     responses:
 *       200:
 *         description: 集合详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerCollection'
 *       404:
 *         description: 集合不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collection = await db.query.serverCollections.findFirst({
      where: eq(serverCollections.id, params.id),
      with: {
        servers: {
          with: {
            server: true
          },
          orderBy: (server, { asc }) => [asc(server.order)]
        },
        creator: {
          columns: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { message: '集合不存在' },
        { status: 404 }
      );
    }

    // 检查是否为私有集合，如果是则检查访问权限
    if (!collection.isPublic) {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      
      // 如果是私有集合且用户不是创建者，拒绝访问
      if (!userId || collection.createdBy !== userId) {
        return NextResponse.json(
          { message: '无权访问此集合' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('获取集合详情时出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /collections/{id}:
 *   put:
 *     summary: 更新集合信息
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               coverImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: 集合已更新
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerCollection'
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
 *         description: 无权更新此集合
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
export async function PUT(
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

    // 查询集合并验证权限
    const collection = await db.query.serverCollections.findFirst({
      where: eq(serverCollections.id, id),
    });

    if (!collection) {
      return NextResponse.json(
        { message: '集合不存在' },
        { status: 404 }
      );
    }

    // 验证权限
    if (collection.createdBy !== userId) {
      return NextResponse.json(
        { message: '无权更新此集合' },
        { status: 403 }
      );
    }

    // 解析和验证请求数据
    const body = await req.json();
    const validationResult = updateCollectionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: '无效的请求数据', 
          errors: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;
    
    // 更新集合
    await db.update(serverCollections)
      .set({
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.isPublic !== undefined && { isPublic: updateData.isPublic }),
        ...(updateData.coverImage !== undefined && { coverImage: updateData.coverImage }),
        updatedAt: new Date()
      })
      .where(eq(serverCollections.id, id));

    // 获取更新后的集合
    const updatedCollection = await db.query.serverCollections.findFirst({
      where: eq(serverCollections.id, id),
      with: {
        servers: {
          with: {
            server: true
          },
          orderBy: (server, { asc }) => [asc(server.order)]
        }
      }
    });

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('更新集合时出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /collections/{id}:
 *   delete:
 *     summary: 删除集合
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
 *     responses:
 *       200:
 *         description: 集合已删除
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
 *         description: 无权删除此集合
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
export async function DELETE(
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

    // A查询集合并验证权限
    const collection = await db.query.serverCollections.findFirst({
      where: eq(serverCollections.id, id),
    });

    if (!collection) {
      return NextResponse.json(
        { message: '集合不存在' },
        { status: 404 }
      );
    }

    // 验证权限
    if (collection.createdBy !== userId) {
      return NextResponse.json(
        { message: '无权删除此集合' },
        { status: 403 }
      );
    }

    // 删除集合 (关联的服务器会通过外键级联删除)
    await db.delete(serverCollections)
      .where(eq(serverCollections.id, id));

    return NextResponse.json({ message: '集合已删除' });
  } catch (error) {
    console.error('删除集合时出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}