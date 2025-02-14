'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession as useNextAuthSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/canvas');
    }
  }, [session, router]);

  // If session exists, show loading or nothing while redirect happens
  if (session) {
    return null;
  }

  const handleDemoClick = async () => {
    try {
      console.log("Starting demo user creation...");
      
      // Create a demo user
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create-demo-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create demo account: ${await response.text()}`);
      }

      const data = await response.json();
      console.log("Demo user created:", data);

      // Log in with the demo credentials
      const result = await signIn('credentials', {
        email: data.data.email,
        password: data.data.password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Failed to sign in:", result.error);
        throw new Error(`Failed to sign in: ${result.error}`);
      }

      // Redirect to canvas after successful login
      console.log("Login successful, redirecting to canvas...");
      router.push('/canvas');
      
    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Show user-friendly error message
      alert(`Failed to create demo account: ${errorMessage}`);
        }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Research Reading Assistant</span>
            <span className="block text-indigo-600 mt-2">Your AI-Powered Study Companion</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Transform the way you study research papers. Get instant summaries, key insights, and engage in meaningful discussions with our AI assistant.
          </p>
          
          {/* Demo Call to Action */}
          <div className="mt-8 mb-8">
            <button
              onClick={handleDemoClick}
              className="transform transition-all duration-300 hover:scale-105 inline-flex items-center justify-center px-12 py-4 text-xl font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
            >
              <span>Try Demo Now</span>
              <svg className="ml-2 -mr-1 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <p className="mt-3 text-sm text-gray-500">No sign-up required. Start exploring instantly!</p>
          </div>

          {/* Sign In/Create Account buttons moved below demo */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 border-indigo-600 md:text-lg"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Smart Summaries</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Get instant, intelligent summaries of research papers that highlight key findings and methodologies.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Interactive Q&A</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Ask questions and get detailed explanations about any aspect of the research paper.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Note Organization</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Keep your research notes organized and easily accessible in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
