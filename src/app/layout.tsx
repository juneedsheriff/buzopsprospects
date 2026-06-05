import type { Metadata } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'BuzOps Prospects',
};

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
