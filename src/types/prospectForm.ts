export interface ProspectPublicFormValues {
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

export const emptyProspectFormValues = (): ProspectPublicFormValues => ({
  email: '',
  firstName: '',
  lastName: '',
  fullName: '',
  phone: '',
  pictureUrl: '',
  locale: '',
  emailVerified: '',
  googleId: '',
});
