import type { UserMemberResponse, VerifyEmailResult } from '@/types/prospects';
import { NextResponse } from 'next/server';

function normalizeClient(data: Record<string, unknown>): UserMemberResponse | null {
  const userId = Number(data.UserId ?? data.userId ?? 0);
  if (!userId) {
    return null;
  }

  return {
    UserId: userId,
    UserMemberId: Number(data.UserMemberId ?? data.userMemberId ?? 0),
    FirstName: String(data.FirstName ?? data.firstName ?? ''),
    LastName: String(data.LastName ?? data.lastName ?? ''),
    Email: String(data.Email ?? data.email ?? ''),
    Phone: data.Phone != null ? String(data.Phone) : data.phone != null ? String(data.phone) : undefined,
    UserMemberIsActive: Boolean(data.UserMemberIsActive ?? data.userMemberIsActive ?? true),
  };
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { found: false, message: 'Enter a valid email address.' } satisfies VerifyEmailResult,
      { status: 400 },
    );
  }

  const apiBaseUrl = process.env.BUZOPS_API_BASE_URL?.replace(/\/$/, '');

  if (!apiBaseUrl) {
    return NextResponse.json({
      found: false,
      message: 'Email lookup is not configured. Use Continue with Google to auto-fill profile data.',
    } satisfies VerifyEmailResult);
  }

  const verifyPath = process.env.BUZOPS_VERIFY_EMAIL_PATH ?? '/UserMember/VerifyUserByEmail';
  const verifyUrl = `${apiBaseUrl}${verifyPath}?email=${encodeURIComponent(email)}`;

  try {
    const headers: HeadersInit = { Accept: 'application/json' };
    const authToken = process.env.BUZOPS_API_AUTH_TOKEN;

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(verifyUrl, { headers, cache: 'no-store' });

    if (!response.ok) {
      return NextResponse.json(
        { found: false, message: 'Could not look up this email in BuzOps.' } satisfies VerifyEmailResult,
        { status: 502 },
      );
    }

    const payload = await response.json() as Record<string, unknown> | Record<string, unknown>[];
    const record = Array.isArray(payload) ? payload[0] : payload;
    const client = record ? normalizeClient(record) : null;

    if (!client) {
      return NextResponse.json({ found: false } satisfies VerifyEmailResult);
    }

    return NextResponse.json({ found: true, client } satisfies VerifyEmailResult);
  }
  catch {
    return NextResponse.json(
      { found: false, message: 'Could not reach the BuzOps API.' } satisfies VerifyEmailResult,
      { status: 502 },
    );
  }
}
