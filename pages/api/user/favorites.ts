import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/database';
import { serverFavorites, servers } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';

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

      return res.status(200).json(favorites);
    } catch (error) {
      console.error('Error fetching favorite servers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { serverId } = req.body;

      if (!serverId) {
        return res.status(400).json({ error: 'Server ID is required' });
      }

      await db.insert(serverFavorites).values({
        userId: session.user.id,
        serverId
      });

      return res.status(200).json({ message: 'Server added to favorites' });
    } catch (error) {
      console.error('Error adding server to favorites:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { serverId } = req.body;

      if (!serverId) {
        return res.status(400).json({ error: 'Server ID is required' });
      }

      await db
        .delete(serverFavorites)
        .where(
          and(
            eq(serverFavorites.userId, session.user.id),
            eq(serverFavorites.serverId, serverId)
          )
        );

      return res.status(200).json({ message: 'Server removed from favorites' });
    } catch (error) {
      console.error('Error removing server from favorites:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 