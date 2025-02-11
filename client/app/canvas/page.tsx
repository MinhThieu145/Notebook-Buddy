'use client';

import { useEffect, useRef } from 'react';

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match its display size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw placeholder text
    ctx.fillStyle = '#374151';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Placeholder Canvas', canvas.width / 2, canvas.height / 2);
  }, []);

  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Canvas Workspace</h1>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-[600px] border-2 border-gray-200 rounded-md"
        />
      </div>
    </div>
  );
}
