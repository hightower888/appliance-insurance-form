/**
 * NextAuth Configuration with Rate Limiting
 * Replace your existing NextAuth configuration with this
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check rate limit
        const identifier = credentials.email.toLowerCase().trim();
        const rateLimitResult = checkRateLimit(identifier, 5); // 5 attempts per 15 min

        if (!rateLimitResult.allowed) {
          // Log the rate limit violation (server-side only)
          console.error(`Rate limit exceeded for: ${identifier}`);
          
          // Return generic error (don't reveal it's a rate limit)
          throw new Error('Invalid credentials');
        }

        try {
          // Your authentication logic here
          // Replace this with your actual authentication
          const user = await authenticateUser(credentials.email, credentials.password);

          if (!user) {
            // Generic error - don't reveal why it failed
            throw new Error('Invalid credentials');
          }

          // Reset rate limit on successful login
          resetRateLimit(identifier);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          // Log detailed error server-side only
          console.error('Authentication error:', error);

          // Return generic error to client
          // Don't reveal framework details (NextAuth.js, etc.)
          throw new Error('Invalid credentials');
        }
      },
    }),
  ],

  pages: {
    signIn: '/auth/login',
    error: '/auth/error', // Generic error page
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // Security settings
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Use secure cookies in production
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

// Placeholder for your authentication function
// Replace this with your actual authentication logic
async function authenticateUser(email: string, password: string) {
  // TODO: Implement your actual authentication logic
  // This is just a placeholder
  
  // Example:
  // const user = await db.user.findUnique({ where: { email } });
  // if (!user) return null;
  // const isValid = await bcrypt.compare(password, user.passwordHash);
  // if (!isValid) return null;
  // return user;
  
  throw new Error('Authentication not implemented');
}

export default NextAuth(authOptions);
