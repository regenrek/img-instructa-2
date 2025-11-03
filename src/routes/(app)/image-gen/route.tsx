import { Outlet, createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { Header } from '~/components/Header';

export const Route = createFileRoute('/(app)/image-gen')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

