import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { serverCollections, collectionServers } from '@/lib/database/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { eq, count, desc, asc } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

// 验证创建集合请求
const createCollectionSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  coverImage: z.string().url().optional().nullable(),
});

/**
 * @swagger
 * /collections:
 *   get:
 *     summary: 获取用户创建的集合
 *     tags: [collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页结果数
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 结果偏移量
 *     responses:
 *       200:
 *         description: 集合列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServerCollection'
 *                 total:
 *                   type: integer
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(req: NextRequest) {
  try {
    // 检查用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 获取用户集合
    const userId = session.user.id;
    const collections = await db.query.serverCollections.findMany({
      where: eq(serverCollections.createdBy, userId),
      orderBy: [desc(serverCollections.createdAt)],
      limit,
      offset,
      with: {
        servers: {
          limit: 5, // 只加载前5个服务器，用于预览
          with: {
            server: {
              columns: {
                id: true,
                name: true,
                version: true,
                icon: true
              }
            }
          },
          orderBy: [asc(collectionServers.order)]
        }
      }
    });

    // 获取总数
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(serverCollections)
      .where(eq(serverCollections.createdBy, userId));

    return NextResponse.json({
      items: collections,
      total
    });
  } catch (error) {
    console.error('获取集合失败:', error);
    return NextResponse.json(
      { message: '获取集合时出错' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /collections:
 *   post:
 *     summary: 创建新集合
 *     tags: [collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
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
 *       201:
 *         description: 集合已创建
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
 */
export async function POST(req: NextRequest) {
  try {
    // 检查用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 });
    }

    // 解析请求体
    const body = await req.json();
    
    // 验证请求数据
    const validationResult = createCollectionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: '无效的请求数据', errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // 创建集合
    const userId = session.user.id;
    const { name, description, isPublic, coverImage } = validationResult.data;
    
    // 生成集合slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;
    
    // 检查slug是否已存在，如存在则添加数字后缀
    let slugExists = true;
    while (slugExists) {
      const existingCollection = await db.query.serverCollections.findFirst({
        where: eq(serverCollections.slug, slug)
      });
      
      if (!existingCollection) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    
    // 插入新集合
    const [collection] = await db.insert(serverCollections)
      .values({
        name,
        description: description || null,
        slug,
        isPublic,
        coverImage: coverImage || null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error('创建集合失败:', error);
    return NextResponse.json(
      { message: '创建集合时出错' },
      { status: 500 }
    );
  }
}