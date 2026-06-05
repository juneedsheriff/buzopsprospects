export interface GoogleJwtPayload {
  iss: string;
  azp?: string;
  aud: string;
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat?: number;
  exp?: number;
}

export interface GoogleUserProfile {
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
  picture?: string;
  emailVerified: boolean;
  locale: string;
  googleId: string;
}

export interface GoogleProspectLoginProps {
  onSuccess: (user: GoogleUserProfile) => void;
  disabled?: boolean;
  /** Show Google One Tap automatically when the page loads (invite links). */
  autoPrompt?: boolean;
}
