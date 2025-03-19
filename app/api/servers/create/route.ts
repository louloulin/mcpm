import { NextRequest, NextResponse } from 'next/server';
import { serverRepository } from '../../../../lib/database/repositories/serverRepository';
import { getUserFromHeaders } from '../../../../lib/auth';

/**
 * POST /api/servers/create - 创建新服务器
 * 需要身份验证
 */
export async function POST(req: NextRequest) {
  try {
    // 获取当前用户身份
    const authUser = getUserFromHeaders(req.headers);
    
    // 如果没有用户登录
    if (!authUser) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      );
    }
    
    // 解析请求体
    const body = await req.json();
    const { 
      name, 
      description, 
      homepage, 
      repository, 
      version, 
      license, 
      startCommand
    } = body;
    
    // 验证必要字段
    if (!name) {
      return NextResponse.json(
        { error: '名称不能为空' },
        { status: 400 }
      );
    }
    
    // 创建服务器
    try {
      const server = await serverRepository.create({
        name,
        description,
        homepage,
        repository,
        authorId: authUser.id,
        version,
        license,
        startCommand
      });
      
      // 返回创建的服务器
      return NextResponse.json(server, { status: 201 });
    } catch (error: any) {
      // 处理特定错误
      if (error.message.includes('标识符已存在')) {
        return NextResponse.json(
          { error: '服务器名称已存在' },
          { status: 409 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('创建服务器失败:', error);
    return NextResponse.json(
      { error: '创建服务器过程中发生错误' },
      { status: 500 }
    );
  }
} 