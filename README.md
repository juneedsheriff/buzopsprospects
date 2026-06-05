# buzopsprospects

Google OAuth integration for the BuzOps Prospect Form (Next.js App Router + TypeScript + Formik).

## Quick start

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local
```

## Google OAuth files

| File | Description |
|------|-------------|
| `src/types/google.ts` | Google JWT and user profile TypeScript interfaces |
| `src/lib/googleAuth.ts` | Credential decode and profile photo fetch utilities |
| `src/components/GoogleProspectLogin.tsx` | Reusable "Continue with Google" button |
| `src/features/prospects/components/ProspectsForm.tsx` | Updated prospect form with Google OAuth wired in |
| `docs/GOOGLE_OAUTH_INTEGRATION.md` | Step-by-step integration guide for existing projects |

## Integration into your main app

Copy the three core files (`types/google.ts`, `lib/googleAuth.ts`, `components/GoogleProspectLogin.tsx`) into your project, then follow [docs/GOOGLE_OAUTH_INTEGRATION.md](./docs/GOOGLE_OAUTH_INTEGRATION.md) to update your root layout, `ProspectsForm.tsx`, and `ProspectsFormFields.tsx`.
