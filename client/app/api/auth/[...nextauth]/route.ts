import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Extend the built-in session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isDemo: boolean;
      provider?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    isDemo: boolean;
    provider?: string;
  }
}

const handler = NextAuth({
  // providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },

      // authorization function
      async authorize(credentials) {
        try {
          // Check for Missing Credentials:
          if (!credentials?.email || !credentials?.password) {
            console.error("Missing credentials");
            throw new Error("Missing credentials");
          }

          console.log("Authorizing credentials for:", credentials.email);

          // Construct the Login URL:
          const loginUrl = `${process.env.NEXT_PUBLIC_API_URL}/login`;
          console.log("Login URL:", loginUrl);
          
          // Send Credentials to the Backend
          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const responseText = await response.text();
          console.log("Raw response:", responseText);

          if (!response.ok) {
            console.error("Login failed:", response.status, response.statusText, responseText);
            throw new Error(`Login failed: ${responseText}`);
          }
          // Read and Log the Response
          const data = JSON.parse(responseText);
          console.log("Parsed login response:", data);

          // Check the status of the response
          // if success, return the user
          if (data.status === 'success' && data.data) {
            const user = {
              id: data.data.id || data.data.email,
              email: data.data.email,
              isDemo: data.data.is_demo || false,
            };
            console.log("Authorized user:", user);
            return user;
          }

          console.error("Login response indicated failure:", data);
          throw new Error("Invalid credentials");
        } catch (error) {
          console.error("Error in authorize:", error);
          throw error; // Throw the error instead of returning null
        }
      }
    })
  ],

  // tell NextJS to use JSON Web Tokens 
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Only save user for OAuth providers (not credentials)
        if (!account || account.type !== 'oauth') {
          console.log('Not an OAuth login, skipping user save');
          return true;
        }

        console.log('Attempting to save user to database...');
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/create-user`;
        console.log('API URL:', apiUrl);
        
        const userData = {
          email: user.email,
          name: user.name,
          provider: account.provider,
          providerId: user.id,
        };
        console.log('User data being sent:', userData);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include',  // Important for CORS
        });

        console.log('Server response status:', response.status);
        console.log('Server response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        if (!response.ok) {
          console.error(`Failed to save user (${response.status}):`, responseText);
          // Don't throw error, just log it and continue
          return true;
        }

        try {
          const data = JSON.parse(responseText);
          console.log('User saved to database:', data);
          return true;
        } catch (e) {
          console.error('Error parsing response:', e);
          // Don't throw error, just log it and continue
          return true;
        }
      } catch (error) {
        console.error('Error in signIn callback:', error);
        // Don't throw error, just log it and continue
        return true;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isDemo = (user as any).isDemo || false;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.isDemo = token.isDemo;
        session.user.provider = token.provider;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  debug: true, // Enable debug messages
});

export { handler as GET, handler as POST };
