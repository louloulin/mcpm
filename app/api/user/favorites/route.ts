import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { serverFavorites, servers } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const favorites = await db
      .select({
        id: servers.id,
        name: servers.name,
        version: servers.version,
        description: servers.description
      })
      .from(serverFavorites)
      .innerJoin(servers, eq(servers.id, serverFavorites.serverId))
      .where(eq(serverFavorites.userId, session.user.id));

    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    console.error('Error fetching favorite servers:', error);
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

    await db.insert(serverFavorites).values({
      id: uuidv4(),
      userId: session.user.id,
      serverId
    });

    return NextResponse.json({ message: 'Server added to favorites' }, { status: 200 });
  } catch (error) {
    console.error('Error adding server to favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    await db
      .delete(serverFavorites)
      .where(
        and(
          eq(serverFavorites.userId, session.user.id),
          eq(serverFavorites.serverId, serverId)
        )
      );

    return NextResponse.json({ message: 'Server removed from favorites' }, { status: 200 });
  } catch (error) {
    console.error('Error removing server from favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 