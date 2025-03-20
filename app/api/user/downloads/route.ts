import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { serverDownloads, servers } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const downloads = await db
      .select({
        id: servers.id,
        name: servers.name,
        version: servers.version,
        description: servers.description,
        downloadedAt: serverDownloads.downloadedAt
      })
      .from(serverDownloads)
      .innerJoin(servers, eq(servers.id, serverDownloads.serverId))
      .where(eq(serverDownloads.userId, session.user.id))
      .orderBy(desc(serverDownloads.downloadedAt))
      .limit(5);

    return NextResponse.json(downloads, { status: 200 });
  } catch (error) {
    console.error('Error fetching downloaded servers:', error);
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

    await db.insert(serverDownloads).values({
      id: uuidv4(),
      userId: session.user.id,
      serverId
    });

    return NextResponse.json({ message: 'Download recorded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error recording download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 