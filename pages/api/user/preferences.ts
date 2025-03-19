import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/database';
import { userPreferences } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const preferences = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, session.user.id)
      });

      if (!preferences) {
        // Return default preferences if none exist
        return res.status(200).json({
          showRecentlyViewed: true,
          showFavorites: true,
          showDownloads: true,
          showRatings: true
        });
      }

      return res.status(200).json(preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { showRecentlyViewed, showFavorites, showDownloads, showRatings } = req.body;

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

      return res.status(200).json(updatedPreferences[0]);
    } catch (error) {
      console.error('Error updating preferences:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 