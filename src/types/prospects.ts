export interface UserMemberResponse {
  UserId: number;
  UserMemberId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  UserMemberIsActive?: boolean;
}

export interface VerifyEmailResult {
  found: boolean;
  client?: UserMemberResponse;
  message?: string;
}
