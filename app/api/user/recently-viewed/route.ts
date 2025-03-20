import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { serverViews, servers } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const recentlyViewed = await db
      .select({
        id: servers.id,
        name: servers.name,
        version: servers.version,
        description: servers.description,
        viewedAt: serverViews.viewedAt
      })
      .from(serverViews)
      .innerJoin(servers, eq(servers.id, serverViews.serverId))
      .where(eq(serverViews.userId, session.user.id))
      .orderBy(desc(serverViews.viewedAt))
      .limit(5);

    return NextResponse.json(recentlyViewed, { status: 200 });
  } catch (error) {
    console.error('Error fetching recently viewed servers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
    }

    await db.insert(serverViews).values({
      id: uuidv4(),
      userId: session.user.id,
      serverId
    });

    return NextResponse.json({ message: 'View recorded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 