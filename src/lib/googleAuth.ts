import { jwtDecode } from 'jwt-decode';

import type { GoogleJwtPayload, GoogleUserProfile } from '@/types/google';

export function decodeGoogleCredential(credential: string): GoogleUserProfile {
  const payload = jwtDecode<GoogleJwtPayload>(credential);

  if (!payload.email) {
    throw new Error('Google credential did not include an email address.');
  }

  return {
    email: payload.email,
    givenName: payload.given_name ?? '',
    familyName: payload.family_name ?? '',
    fullName: payload.name ?? [payload.given_name, payload.family_name].filter(Boolean).join(' '),
    picture: payload.picture,
    emailVerified: Boolean(payload.email_verified),
    locale: payload.locale ?? '',
    googleId: payload.sub,
  };
}

export async function fetchGoogleProfileImageAsFile(
  pictureUrl: string,
  filename = 'google-profile.jpg',
): Promise<File | null> {
  try {
    const proxyUrl = `/api/google/profile-photo?url=${encodeURIComponent(pictureUrl)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const type = blob.type || 'image/jpeg';

    return new File([blob], filename, { type });
  }
  catch {
    return null;
  }
}
