import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/database';
import { serverViews, servers } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';

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

      return res.status(200).json(recentlyViewed);
    } catch (error) {
      console.error('Error fetching recently viewed servers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 