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
  picture?: string;
}

export interface GoogleProspectLoginProps {
  onSuccess: (user: GoogleUserProfile) => void;
  disabled?: boolean;
}
