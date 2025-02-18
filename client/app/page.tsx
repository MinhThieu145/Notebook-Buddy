'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      router.push('/canvas');
    }
  }, [isSignedIn, user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex flex-col">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Welcome to Notebook Buddy
        </h1>
        
        <p className="text-lg text-white mb-8 text-center max-w-2xl">
          Your AI-powered research assistant. Transform your reading experience with intelligent note-taking and organization.
        </p>

        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="rounded-lg px-6 py-3 bg-white text-purple-600 font-medium hover:bg-gray-100 transition-colors">
              Sign In
            </button>
          </SignInButton>
          
          <SignUpButton mode="modal">
            <button className="rounded-lg px-6 py-3 bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-2">Smart Notes</h3>
            <p className="text-white text-opacity-90">
              Take intelligent notes with AI-powered suggestions and insights.
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-2">Easy Organization</h3>
            <p className="text-white text-opacity-90">
              Automatically organize your research with smart categorization.
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-2">Research Assistant</h3>
            <p className="text-white text-opacity-90">
              Get AI-powered help with summarizing and analyzing your research.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
