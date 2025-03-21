import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FileStorageFactory } from '@/lib/storage/FileStorageFactory';

/**
 * 获取单个文件信息
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
): Promise<NextResponse> {
  try {
    const fileId = params.fileId;
    if (!fileId) {
      return NextResponse.json({ error: '缺少文件ID' }, { status: 400 });
    }

    // 获取用户会话，确认权限
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权访问，请先登录' },
        { status: 401 }
      );
    }

    // 获取存储服务
    const storageFactory = FileStorageFactory.getInstance();
    const fileStorage = storageFactory.createDefaultStorageService();

    // 检查文件是否存在
    const fileExists = await fileStorage.fileExists(fileId);
    if (!fileExists) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 获取文件元数据
    const metadata = await fileStorage.getFileMetadata(fileId);

    // 权限检查：普通用户只能查看自己的文件，管理员可以查看所有文件
    const isAdmin = session.user.role === 'admin';
    if (!isAdmin && metadata.userId !== session.user.id && metadata.access !== 'public') {
      return NextResponse.json(
        { error: '无权查看此文件' },
        { status: 403 }
      );
    }

    // 生成临时下载链接
    const downloadUrl = await fileStorage.getDownloadUrl(fileId, 3600);

    // 返回文件信息和下载链接
    return NextResponse.json({
      ...metadata,
      downloadUrl
    });
  } catch (error: any) {
    console.error('获取文件信息失败:', error);
    
    return NextResponse.json(
      { error: `获取文件信息失败: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * 更新文件信息
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { fileId: string } }
): Promise<NextResponse> {
  try {
    const fileId = params.fileId;
    if (!fileId) {
      return NextResponse.json({ error: '缺少文件ID' }, { status: 400 });
    }

    // 获取用户会话，确认权限
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权访问，请先登录' },
        { status: 401 }
      );
    }

    // 获取存储服务
    const storageFactory = FileStorageFactory.getInstance();
    const fileStorage = storageFactory.createDefaultStorageService();

    // 检查文件是否存在
    const fileExists = await fileStorage.fileExists(fileId);
    if (!fileExists) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 获取文件元数据
    const metadata = await fileStorage.getFileMetadata(fileId);

    // 权限检查：普通用户只能更新自己的文件，管理员可以更新所有文件
    const isAdmin = session.user.role === 'admin';
    if (!isAdmin && metadata.userId !== session.user.id) {
      return NextResponse.json(
        { error: '无权更新此文件' },
        { status: 403 }
      );
    }

    // 获取要更新的字段
    const data = await req.json();
    const updatableFields = ['filename', 'access', 'metadata', 'entityId', 'entityType'];
    
    // 过滤出可更新的字段
    const updateData: Record<string, any> = {};
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '未提供任何可更新的字段' },
        { status: 400 }
      );
    }

    // 更新文件元数据
    const updatedMetadata = await fileStorage.updateFileMetadata(fileId, updateData);

    // 返回更新后的文件信息
    return NextResponse.json(updatedMetadata);
  } catch (error: any) {
    console.error('更新文件信息失败:', error);
    
    return NextResponse.json(
      { error: `更新文件信息失败: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * 删除单个文件
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { fileId: string } }
): Promise<NextResponse> {
  try {
    const fileId = params.fileId;
    if (!fileId) {
      return NextResponse.json({ error: '缺少文件ID' }, { status: 400 });
    }

    // 获取用户会话，确认权限
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权访问，请先登录' },
        { status: 401 }
      );
    }

    // 获取存储服务
    const storageFactory = FileStorageFactory.getInstance();
    const fileStorage = storageFactory.createDefaultStorageService();

    // 检查文件是否存在
    const fileExists = await fileStorage.fileExists(fileId);
    if (!fileExists) {
      return NextResponse.json({ error: '文件不存在或已被删除' }, { status: 404 });
    }

    // 获取文件元数据
    const metadata = await fileStorage.getFileMetadata(fileId);

    // 权限检查：普通用户只能删除自己的文件，管理员可以删除所有文件
    const isAdmin = session.user.role === 'admin';
    if (!isAdmin && metadata.userId !== session.user.id) {
      return NextResponse.json(
        { error: '无权删除此文件' },
        { status: 403 }
      );
    }

    // 删除文件
    const success = await fileStorage.deleteFile(fileId);

    // 返回删除结果
    if (success) {
      return NextResponse.json({ success: true, message: '文件已成功删除' });
    } else {
      return NextResponse.json(
        { error: '删除文件失败' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('删除文件失败:', error);
    
    return NextResponse.json(
      { error: `删除文件失败: ${error.message}` },
      { status: 500 }
    );
  }
} 