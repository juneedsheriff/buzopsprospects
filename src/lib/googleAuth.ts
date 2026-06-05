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
    picture: payload.picture,
  };
}

export async function fetchGoogleProfileImageAsFile(
  pictureUrl: string,
  filename = 'google-profile.jpg',
): Promise<File | null> {
  try {
    const response = await fetch(pictureUrl);

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
