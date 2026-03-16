import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Expense Tracker | Cloud-Based Personal Finance',
  description: 'Track expenses, set budgets, and view analytics. Your money, visible.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable + ' font-sans'}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
