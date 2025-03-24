import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './database';
import { users } from './database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyToken as verifyJwtToken } from './auth-edge';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role?: string | null;
    }
  }
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
  }
}

/**
 * 从请求头中获取用户信息
 */
export function getUserFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id');
  const userRole = headers.get('x-user-role');

  if (!userId || !userRole) {
    return null;
  }

  return {
    id: userId,
    name: headers.get('x-user-name') || 'unknown',
    role: userRole,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            password: users.password
          })
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user[0]) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user[0].password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          role: user[0].role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string
        }
      };
    }
  }
}; 