import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FileStorageFactory } from '@/lib/storage/FileStorageFactory';
import crypto from 'crypto';

/**
 * 验证签名
 * @param fileId 文件ID
 * @param expires 过期时间戳
 * @param signature 签名
 */
function verifySignature(fileId: string, expires: number, signature: string): boolean {
  // 检查是否已过期
  if (Date.now() / 1000 > expires) {
    return false;
  }

  // 验证签名
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FILE_STORAGE_SECRET || 'file-storage-secret')
    .update(`${fileId}:${expires}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * 处理文件下载请求
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

    // 获取URL查询参数
    const url = new URL(req.url);
    const signatureParam = url.searchParams.get('signature');
    const expiresParam = url.searchParams.get('expires');
    const forceDownload = url.searchParams.get('download') === 'true';
    const inline = url.searchParams.get('inline') === 'true';

    // 检查访问权限
    if (metadata.access !== 'public') {
      // 对于非公开文件，需要检查签名或用户会话
      if (signatureParam && expiresParam) {
        // 验证签名和过期时间
        const expires = parseInt(expiresParam, 10);
        if (!verifySignature(fileId, expires, signatureParam)) {
          return NextResponse.json({ error: '链接已过期或无效' }, { status: 403 });
        }
      } else {
        // 检查用户会话
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
          return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 对于受保护的文件，检查是否有访问权限
        if (metadata.access === 'protected' && metadata.userId !== session.user.id) {
          // 未来可以在此处添加更复杂的权限检查
          return NextResponse.json({ error: '没有权限访问此文件' }, { status: 403 });
        }
      }
    }

    // 下载文件内容
    const fileContent = await fileStorage.downloadFile(fileId);

    if (!(fileContent instanceof Buffer)) {
      return NextResponse.json({ error: '无法读取文件内容' }, { status: 500 });
    }

    // 创建响应
    const response = new NextResponse(fileContent);

    // 设置内容类型
    response.headers.set('Content-Type', metadata.mimetype);
    
    // 设置内容长度
    response.headers.set('Content-Length', metadata.size.toString());

    // 设置缓存控制
    if (metadata.access === 'public') {
      // 公开文件可以缓存
      response.headers.set('Cache-Control', 'public, max-age=31536000');
    } else {
      // 非公开文件不缓存
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }

    // 设置内容处置
    const filename = encodeURIComponent(metadata.filename);
    if (forceDownload) {
      // 强制下载
      response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    } else if (inline) {
      // 内联显示
      response.headers.set('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      // 根据MIME类型智能选择
      const inlineTypes = [
        'text/', 'image/', 'video/', 'audio/',
        'application/pdf', 'application/json'
      ];
      
      const shouldInline = inlineTypes.some(type => metadata.mimetype.startsWith(type));
      
      if (shouldInline) {
        response.headers.set('Content-Disposition', `inline; filename="${filename}"`);
      } else {
        response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      }
    }

    return response;
  } catch (error: any) {
    console.error('文件下载失败:', error);
    
    return NextResponse.json(
      { error: `文件下载失败: ${error.message}` },
      { status: 500 }
    );
  }
} 