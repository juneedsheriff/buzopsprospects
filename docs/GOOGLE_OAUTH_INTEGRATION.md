# Google OAuth — Prospect Form Integration

This guide covers adding Google OAuth to the Prospect Form in an existing Next.js App Router project.

## 1. Install dependencies

```bash
npm install @react-oauth/google jwt-decode
```

## 2. Environment variable

Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

See `.env.example` for the template.

## 3. Wrap the app with `GoogleOAuthProvider`

In your existing root layout (`src/app/layout.tsx`), wrap `{children}`:

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ...existing providers (Mantine, next-intl, etc.) */}
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
```

Place `GoogleOAuthProvider` outside route-specific providers so it is available on the prospect form page.

## 4. New files (copy into your project)

| File | Purpose |
|------|---------|
| `src/types/google.ts` | TypeScript interfaces for Google JWT payload and user profile |
| `src/lib/googleAuth.ts` | JWT decode + profile photo fetch helpers |
| `src/components/GoogleProspectLogin.tsx` | Reusable Google sign-in button |

## 5. Update `ProspectsForm.tsx`

Key additions:

- Import `GoogleProspectLogin`, `GoogleUserProfile`, and `fetchGoogleProfileImageAsFile`
- Add `handleGoogleAuthSuccess` to populate Formik fields, upload the Google photo, and run `handleVerifyEmail`
- Pass `googleLoginSlot` to `ProspectsFormFields`

See `src/features/prospects/components/ProspectsForm.tsx` for the full modified file.

## 6. Update `ProspectsFormFields.tsx`

Add an optional `googleLoginSlot` prop and render it **immediately above the email field**:

```tsx
import type { ReactNode } from 'react';

// Add to props interface:
googleLoginSlot?: ReactNode;

// In the render, before the email input:
{googleLoginSlot && !showAdditional && (
  <div className="space-y-4">
    {googleLoginSlot}
    <div className="relative flex items-center py-1">
      <div className="grow border-t border-[#E2E8F0] dark:border-slate-600" />
      <span className="mx-3 shrink-0 text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-muted-foreground">
        or
      </span>
      <div className="grow border-t border-[#E2E8F0] dark:border-slate-600" />
    </div>
  </div>
)}
```

See `src/features/prospects/components/ProspectsFormFields.google-oauth.snippet.tsx` for reference.

## 7. Behavior summary

On successful Google authentication:

1. JWT credential is decoded via `jwt-decode`
2. Formik fields are populated: `email`, `firstName`, `lastName`
3. Google profile photo is fetched and passed to `handleImageUpload` for preview
4. Existing `handleVerifyEmail()` runs — if the email exists, `EmailExistsModal` opens as before
5. Loading state is shown on the button during authentication
6. Errors are surfaced via Mantine notifications

Existing prospect form behavior (draft save, validation, submit, camera upload, etc.) is unchanged.
