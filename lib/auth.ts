/**
 * NextAuth v5 Configuration
 *
 * Authentication configuration for multi-tenant email system.
 * Uses JWT strategy with bcrypt password verification.
 *
 * Security:
 * - Passwords verified with bcrypt.compare
 * - JWT tokens for stateless authentication
 * - Session updates tracked in database
 * - Only active users can login
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import type { User } from '@/domain/entities/User';

const userRepository = new PostgresUserRepository();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          // Find user by email
          const user = await userRepository.findByEmail(email);
          if (!user) {
            return null; // User not found
          }

          // Check if user is active
          if (!user.active) {
            console.warn(`Login attempt for inactive user: ${email}`);
            return null; // Account deactivated
          }

          // Verify password
          const isValidPassword = await user.verifyPassword(password);
          if (!isValidPassword) {
            return null; // Invalid password
          }

          // Update last session timestamp
          try {
            await userRepository.updateLastSession(user.id);
          } catch (error) {
            console.error('Failed to update last session:', error);
            // Non-critical error, continue with login
          }

          // Return user data (NextAuth will create JWT)
          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page
  },
  callbacks: {
    /**
     * JWT callback - add custom claims to token
     * Called when JWT is created or updated
     */
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role || 'user';
      }

      // Session update (e.g., user changes profile)
      if (trigger === 'update') {
        // Fetch fresh user data from database
        try {
          const userId = parseInt(token.id as string);
          const freshUser = await userRepository.findById(userId);
          if (freshUser) {
            token.email = freshUser.email;
            token.role = freshUser.role;
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }

      return token;
    },

    /**
     * Session callback - expose user data to client
     * Called whenever session is accessed
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = (token.role as 'user' | 'admin') || 'user';
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});

/**
 * Type augmentation for NextAuth
 * Adds custom properties to session and JWT
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: 'user' | 'admin';
    };
  }

  interface User {
    id: string;
    email: string;
    role: 'user' | 'admin';
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: 'user' | 'admin';
  }
}
