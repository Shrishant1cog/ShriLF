import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/ui/Navbar';

export const metadata: Metadata = {
  title: 'FarmConnect | Direct Farmer Market Information System',
  description: 'Direct agricultural connection between local farmers and consumers across Karnataka.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-stone-900 text-stone-400 text-xs py-8 border-t border-stone-800 text-center">
          <p>© 2026 FarmConnect Karnataka. Transparent farm-to-door direct marketplace.</p>
          <p className="mt-1 text-stone-500">Prices listed are direct <b>Farmer Listed Prices</b>.</p>
        </footer>
      </body>
    </html>
  );
}