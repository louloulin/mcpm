import { Server } from '@/lib/database/schema';
import { db } from '@/lib/database';
import { eq, and, inArray } from 'drizzle-orm';
import { servers, dependencies, userServers, notifications } from '@/lib/database/schema';
import { nanoid } from 'nanoid';

/**
 * Update notification system
 * Checks for updates to servers that users depend on and sends notifications
 */
class UpdateNotifier {
  /**
   * Checks for updates to all servers in the system
   */
  async checkForUpdates(): Promise<void> {
    try {
      // Get all servers
      const allServers = await db.select().from(servers);
      
      // For each server, check if there are any dependencies with newer versions
      for (const server of allServers) {
        await this.checkServerDependencies(server);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /**
   * Checks dependencies for a specific server
   */
  async checkServerDependencies(server: Server): Promise<void> {
    try {
      // Get all dependencies for the server
      const serverDependencies = await db
        .select()
        .from(dependencies)
        .where(eq(dependencies.serverId, server.id));

      // For each dependency, check if there's a newer version
      for (const dependency of serverDependencies) {
        const dependentServer = await db
          .select()
          .from(servers)
          .where(eq(servers.key, dependency.dependencyKey))
          .limit(1);

        if (dependentServer.length === 0) continue;

        const [dependent] = dependentServer;

        // Check if the dependency version is newer than what's specified
        if (this.isNewerVersion(dependent.version, dependency.version)) {
          await this.notifyUsersOfUpdate(server, dependent);
        }
      }
    } catch (error) {
      console.error(`Error checking dependencies for server ${server.name}:`, error);
    }
  }

  /**
   * Compares two semantic versions
   * @returns true if version1 is newer than version2
   */
  isNewerVersion(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }

    return false; // Versions are equal
  }

  /**
   * Notifies users of an update to a dependent server
   */
  async notifyUsersOfUpdate(parentServer: Server, updatedDependency: Server): Promise<void> {
    try {
      // Find users who use the parent server
      const serverUsers = await db
        .select()
        .from(userServers)
        .where(eq(userServers.serverId, parentServer.id));

      // Create notifications for each user
      for (const userServer of serverUsers) {
        await db.insert(notifications).values({
          userId: userServer.userId,
          title: `Update available for dependency`,
          message: `${updatedDependency.name} v${updatedDependency.version} is now available. Your server ${parentServer.name} depends on an older version.`,
          type: 'update',
          category: 'server',
          read: false,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error notifying users of update:', error);
    }
  }

  /**
   * Sets up a cron job to periodically check for updates
   */
  scheduleUpdateChecks(intervalHours = 24): NodeJS.Timeout {
    // Convert hours to milliseconds
    const interval = intervalHours * 60 * 60 * 1000;
    
    console.log(`🔔 Scheduling update checks every ${intervalHours} hours`);
    
    // Schedule the recurring task
    return setInterval(() => {
      console.log('🔍 Checking for server updates...');
      this.checkForUpdates()
        .then(() => console.log('✅ Update check completed'))
        .catch(err => console.error('❌ Error during update check:', err));
    }, interval);
  }
}

export const updateNotifier = new UpdateNotifier(); 