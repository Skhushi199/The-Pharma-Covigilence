import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata = {
  title: 'PharmaVigil — Adverse Drug Reaction Reporting',
  description:
    'A pharmacovigilance platform for reporting and monitoring adverse drug reactions. Powered by MedDRA classification and Naranjo causality assessment.',
  keywords: 'pharmacovigilance, adverse drug reaction, ADR reporting, MedDRA, drug safety',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="antialiased bg-amber-50 text-emerald-950 min-h-screen" suppressHydrationWarning>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
