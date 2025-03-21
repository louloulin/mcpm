import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FileStorageFactory } from '@/lib/storage/FileStorageFactory';
import { FileFilter } from '@/lib/storage/FileStorageService';

/**
 * 获取文件列表
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
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

    // 获取URL查询参数
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id; // 默认查当前用户的文件
    const entityId = url.searchParams.get('entityId') || undefined;
    const entityType = url.searchParams.get('entityType') || undefined;
    const access = url.searchParams.get('access') as 'public' | 'private' | 'protected' | undefined;
    const filename = url.searchParams.get('filename') || undefined;
    const mimetype = url.searchParams.get('mimetype') || undefined;
    
    // 解析数值参数
    const minSize = url.searchParams.get('minSize') ? parseInt(url.searchParams.get('minSize')!, 10) : undefined;
    const maxSize = url.searchParams.get('maxSize') ? parseInt(url.searchParams.get('maxSize')!, 10) : undefined;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 100;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!, 10) : 0;
    
    // 日期参数
    const uploadedAfter = url.searchParams.get('uploadedAfter') 
      ? new Date(url.searchParams.get('uploadedAfter')!) 
      : undefined;
    
    const uploadedBefore = url.searchParams.get('uploadedBefore') 
      ? new Date(url.searchParams.get('uploadedBefore')!) 
      : undefined;
    
    // 权限检查：普通用户只能查看自己的文件，管理员可以查看所有文件
    const isAdmin = session.user.role === 'admin';
    if (!isAdmin && userId !== session.user.id) {
      return NextResponse.json(
        { error: '无权查看其他用户的文件' },
        { status: 403 }
      );
    }

    // 构建过滤条件
    const filter: FileFilter = {
      userId,
      entityId,
      entityType,
      access,
      filename,
      mimetype,
      minSize,
      maxSize,
      uploadedAfter,
      uploadedBefore
    };

    // 查询文件列表
    const files = await fileStorage.findFiles(filter, limit, offset);

    // 返回结果
    return NextResponse.json({
      files,
      count: files.length,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('获取文件列表失败:', error);
    
    return NextResponse.json(
      { error: `获取文件列表失败: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * 批量删除文件
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
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

    // 获取要删除的文件ID列表
    const data = await req.json();
    const fileIds = data.fileIds;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: '缺少有效的文件ID列表' },
        { status: 400 }
      );
    }

    // 权限检查：普通用户只能删除自己的文件，管理员可以删除所有文件
    const isAdmin = session.user.role === 'admin';
    if (!isAdmin) {
      // 获取文件信息，检查所有权
      const files = await Promise.all(
        fileIds.map(id => fileStorage.getFileMetadata(id).catch(() => null))
      );

      // 过滤出非用户所有的文件
      const unauthorizedFiles = files
        .filter(file => file !== null && file.userId !== session.user.id)
        .map(file => file?.id);

      if (unauthorizedFiles.length > 0) {
        return NextResponse.json(
          { error: '无权删除他人的文件', unauthorizedFiles },
          { status: 403 }
        );
      }
    }

    // 批量删除文件
    const results = await fileStorage.deleteFiles(fileIds);
    
    // 处理结果
    const successful: string[] = [];
    const failed: string[] = [];
    
    results.forEach((success, id) => {
      if (success) {
        successful.push(id);
      } else {
        failed.push(id);
      }
    });

    // 返回删除结果
    return NextResponse.json({
      successful,
      failed,
      total: fileIds.length,
      successCount: successful.length,
      failCount: failed.length
    });
  } catch (error: any) {
    console.error('删除文件失败:', error);
    
    return NextResponse.json(
      { error: `删除文件失败: ${error.message}` },
      { status: 500 }
    );
  }
} 