import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { userPreferences } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id)
    });

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        showRecentlyViewed: true,
        showFavorites: true,
        showDownloads: true,
        showRatings: true
      }, { status: 200 });
    }

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { showRecentlyViewed, showFavorites, showDownloads, showRatings } = body;

    const updatedPreferences = await db
      .insert(userPreferences)
      .values({
        userId: session.user.id,
        showRecentlyViewed,
        showFavorites,
        showDownloads,
        showRatings
      })
      .onConflictDoUpdate({
        target: [userPreferences.userId],
        set: {
          showRecentlyViewed,
          showFavorites,
          showDownloads,
          showRatings
        }
      })
      .returning();

    return NextResponse.json(updatedPreferences[0], { status: 200 });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 