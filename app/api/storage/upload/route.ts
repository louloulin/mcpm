import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FileStorageFactory } from '@/lib/storage/FileStorageFactory';
import { UploadOptions } from '@/lib/storage/FileStorageService';

/**
 * 处理文件上传请求
 * 
 * 支持两种上传方式：
 * 1. 直接上传文件（multipart/form-data）
 * 2. 通过URL上传（application/json 带 url 字段）
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
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

    // 检查内容类型，确定上传方式
    const contentType = req.headers.get('content-type') || '';

    // 准备通用的上传选项
    const baseOptions: Partial<UploadOptions> = {
      userId: session.user.id,
      access: 'private', // 默认设置为私有
    };

    if (contentType.includes('multipart/form-data')) {
      // 处理文件上传（multipart/form-data）
      const formData = await req.formData();
      
      // 从表单数据中获取文件
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: '未找到有效的文件数据' },
          { status: 400 }
        );
      }

      // 获取其他表单字段作为选项
      const entityId = formData.get('entityId')?.toString();
      const entityType = formData.get('entityType')?.toString();
      const access = formData.get('access')?.toString() as 'public' | 'private' | 'protected' | undefined;
      const metadata = formData.get('metadata')?.toString();

      // 构建上传选项
      const options: UploadOptions = {
        ...baseOptions,
        filename: file.name,
        contentType: file.type,
        entityId,
        entityType,
        access,
        metadata: metadata ? JSON.parse(metadata) : undefined,
      };

      // 将文件转换为 Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // 上传文件
      const result = await fileStorage.uploadFile(buffer, options);
      
      return NextResponse.json(result, { status: 201 });
    } else if (contentType.includes('application/json')) {
      // 处理通过URL上传
      const data = await req.json();
      
      if (!data.url || typeof data.url !== 'string') {
        return NextResponse.json(
          { error: '缺少有效的URL' },
          { status: 400 }
        );
      }

      // 构建上传选项
      const options: UploadOptions = {
        ...baseOptions,
        filename: data.filename,
        contentType: data.contentType,
        entityId: data.entityId,
        entityType: data.entityType,
        access: data.access,
        metadata: data.metadata,
      };

      // 通过URL上传
      const result = await fileStorage.uploadFromUrl(data.url, options);
      
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(
        { error: '不支持的内容类型，请使用 multipart/form-data 或 application/json' },
        { status: 415 }
      );
    }
  } catch (error: any) {
    console.error('文件上传失败:', error);
    
    return NextResponse.json(
      { error: `文件上传失败: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * 选项配置（简化跨域请求等）
 */
export const config = {
  api: {
    bodyParser: false, // 禁用默认的 bodyParser，手动处理 multipart/form-data
  },
}; 