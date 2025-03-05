import React, { ReactNode } from 'react';
import { Header } from './header';
import { ActiveOperations } from '../ui/operation-progress';

interface AppContainerProps {
  children: ReactNode;
  session?: any;
}

export function AppContainer({ children, session }: AppContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header session={session} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <ActiveOperations />
    </div>
  );
}
