import type { VerifyEmailResult } from '@/types/prospects';

export async function verifyProspectEmail(email: string): Promise<VerifyEmailResult> {
  const response = await fetch(
    `/api/prospects/verify-email?email=${encodeURIComponent(email)}`,
    { method: 'GET' },
  );

  if (!response.ok) {
    throw new Error('Could not verify email.');
  }

  return response.json() as Promise<VerifyEmailResult>;
}
