import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("Missing credentials");
            throw new Error("Missing credentials");
          }

          console.log("Authorizing credentials for:", credentials.email);
          
          const loginUrl = `${process.env.NEXT_PUBLIC_API_URL}/login`;
          console.log("Login URL:", loginUrl);
          
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

          const data = JSON.parse(responseText);
          console.log("Parsed login response:", data);

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
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT Callback - Input:", { token, user });
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isDemo = user.isDemo;
      }
      console.log("JWT Callback - Output:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback - Input:", { session, token });
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.isDemo = token.isDemo;
      }
      console.log("Session Callback - Output:", session);
      return session;
    }
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  debug: true, // Enable debug messages
});

export { handler as GET, handler as POST };
