'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-gray-100' : '';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link 
              href="/" 
              className={`inline-flex items-center px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md ${isActive('/')}`}
            >
              Home
            </Link>
            <Link 
              href="/canvas" 
              className={`inline-flex items-center px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md ${isActive('/canvas')}`}
            >
              Canvas
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
