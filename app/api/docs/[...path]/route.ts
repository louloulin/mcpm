import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Server } from '../../../../lib/types';

/**
 * API文档服务端点
 * 
 * 该API端点用于提供服务器的API文档文件，支持以下路径格式：
 * - /api/docs/:serverId            - 获取服务器API文档索引页
 * - /api/docs/:serverId/style.css  - 获取服务器API文档样式
 * - /api/docs/:serverId/script.js  - 获取服务器API文档脚本
 * - /api/docs/:serverId/:file.html - 获取服务器API文档HTML页面
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathSegments = params.path;

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json({ error: '无效的文档路径' }, { status: 400 });
  }

  const serverId = pathSegments[0];
  const docFile = pathSegments.length > 1 ? pathSegments.slice(1).join('/') : 'index.html';

  try {
    // 获取服务器信息
    const serverInfo = await getServerInfo(serverId);
    if (!serverInfo) {
      return NextResponse.json({ error: '服务器不存在' }, { status: 404 });
    }

    // 构建文档路径
    const docsDir = path.join(process.cwd(), 'data', 'servers', serverId, 'docs');
    
    // 检查文档目录是否存在
    if (!fs.existsSync(docsDir)) {
      return NextResponse.json({ error: '该服务器没有API文档' }, { status: 404 });
    }

    // 构建文件完整路径
    const filePath = path.join(docsDir, docFile);
    
    // 检查文件是否存在且在文档目录内（安全检查）
    if (!fs.existsSync(filePath) || !filePath.startsWith(docsDir)) {
      return NextResponse.json({ error: '文档文件不存在' }, { status: 404 });
    }

    // 获取文件内容
    const fileContent = fs.readFileSync(filePath);
    
    // 设置适当的内容类型
    const contentType = getContentType(filePath);
    
    // 返回文件内容
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType
      }
    });
  } catch (error: any) {
    console.error(`提供API文档时出错:`, error);
    return NextResponse.json({ error: '提供API文档时出错' }, { status: 500 });
  }
}

/**
 * 获取服务器信息
 */
async function getServerInfo(serverId: string): Promise<Server | null> {
  try {
    const serverInfoPath = path.join(process.cwd(), 'data', 'servers', serverId, 'info.json');
    
    if (!fs.existsSync(serverInfoPath)) {
      return null;
    }
    
    const serverInfo = JSON.parse(fs.readFileSync(serverInfoPath, 'utf8'));
    return serverInfo;
  } catch (error) {
    console.error(`获取服务器信息时出错:`, error);
    return null;
  }
}

/**
 * 根据文件扩展名获取内容类型
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'text/plain; charset=utf-8';
  }
} 