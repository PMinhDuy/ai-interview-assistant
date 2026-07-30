import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { StyledComponentsRegistry } from './registry';
import { QueryProvider } from '../providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interview Assistant',
  description: 'AI-powered mock interview practice platform with instant evaluation and feedback',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <QueryProvider>
          <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        </QueryProvider>
      </body>
    </html>
  );
}
