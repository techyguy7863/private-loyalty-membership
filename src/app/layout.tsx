import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Private Loyalty Membership | ZK dApp on Midnight Network',
  description: 'Prove VIP loyalty status and claim rewards without revealing your point balance or identity. Zero-knowledge smart contracts on Midnight Network.',
  keywords: 'midnight network, zero knowledge, loyalty, ZK proof, privacy, blockchain, compact',
  openGraph: {
    title: 'Private Loyalty Membership — ZK dApp',
    description: 'Privacy-preserving loyalty reward system on Midnight Network',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
