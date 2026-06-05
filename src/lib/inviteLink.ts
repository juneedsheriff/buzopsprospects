export function getProspectInvitePath(): string {
  return '/invite';
}

export function getProspectInviteUrl(origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${getProspectInvitePath()}`;
}
