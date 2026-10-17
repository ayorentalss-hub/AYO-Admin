'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium tracking-wide">Loading AYO Admin...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <App />;
}
