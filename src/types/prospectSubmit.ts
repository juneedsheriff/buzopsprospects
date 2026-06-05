export interface SubmitProspectPayload {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  pictureUrl: string;
  locale: string;
  emailVerified: string;
  googleId: string;
}

export interface SubmitProspectResult {
  success: boolean;
  id?: string;
  message?: string;
}
