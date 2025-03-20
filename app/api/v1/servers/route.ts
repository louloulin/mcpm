import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const author_id = searchParams.get('author_id');
    
    // 使用原始 SQL 查询以避免模式不一致问题
    let query = sql`
      SELECT 
        id, key, name, version, description, author_id, 
        homepage, repository, license, downloads, 
        created_at, updated_at, url, status, type
      FROM servers
    `;
    
    // 添加过滤条件
    if (author_id) {
      query = sql`${query} WHERE author_id = ${author_id}`;
    }
    
    // 添加排序和分页
    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    // 执行查询
    const results = await db.execute(query);
    
    return NextResponse.json({
      status: 'success',
      data: results.rows
    });
  } catch (error: any) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Failed to fetch servers' 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 验证基本必填字段
    if (!data.name || !data.key || !data.type || !data.url) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing required fields: name, key, type, and url are required' 
        }, 
        { status: 400 }
      );
    }
    
    // 使用原始 SQL 插入数据以避免模式不一致问题
    const query = sql`
      INSERT INTO servers (
        key, name, version, description, 
        homepage, repository, license, 
        url, status, type
      ) VALUES (
        ${data.key}, ${data.name}, ${data.version || '1.0.0'}, ${data.description || null},
        ${data.homepage || null}, ${data.repository || null}, ${data.license || null},
        ${data.url}, ${data.status || 'offline'}, ${data.type}
      )
      RETURNING id, key, name, version, description, created_at
    `;
    
    // 执行查询
    const result = await db.execute(query);
    
    return NextResponse.json({
      status: 'success',
      data: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating server:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Failed to create server' 
      }, 
      { status: 500 }
    );
  }
} 