import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { SubmitProspectPayload, SubmitProspectResult } from '@/types/prospectSubmit';
import { NextResponse } from 'next/server';

const PHOTO_BUCKET = 'prospect-photos';

function parsePayload(raw: string | null): SubmitProspectPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const data = JSON.parse(raw) as Partial<SubmitProspectPayload>;

    if (!data.email?.trim() || !data.email.includes('@')) {
      return null;
    }

    return {
      email: data.email.trim(),
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      fullName: data.fullName?.trim() ?? '',
      phone: data.phone?.trim() ?? '',
      pictureUrl: data.pictureUrl?.trim() ?? '',
      locale: data.locale?.trim() ?? '',
      emailVerified: data.emailVerified?.trim() ?? '',
      googleId: data.googleId?.trim() ?? '',
    };
  }
  catch {
    return null;
  }
}

async function uploadPhoto(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  file: File,
  email: string,
): Promise<string | null> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const path = `${safeEmail}/${Date.now()}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      } satisfies SubmitProspectResult,
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const payload = parsePayload(formData.get('data')?.toString() ?? null);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Enter a valid email address before submitting.' } satisfies SubmitProspectResult,
      { status: 400 },
    );
  }

  if (!payload.firstName && !payload.lastName && !payload.fullName) {
    return NextResponse.json(
      { success: false, message: 'Enter at least a first name, last name, or full name.' } satisfies SubmitProspectResult,
      { status: 400 },
    );
  }

  const photo = formData.get('photo');

  if (photo instanceof File && photo.size > 0) {
    const uploadedUrl = await uploadPhoto(supabase, photo, payload.email);

    if (uploadedUrl) {
      payload.pictureUrl = uploadedUrl;
    }
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert({
      email: payload.email,
      first_name: payload.firstName,
      last_name: payload.lastName,
      full_name: payload.fullName || [payload.firstName, payload.lastName].filter(Boolean).join(' '),
      phone: payload.phone,
      picture_url: payload.pictureUrl,
      locale: payload.locale,
      email_verified: payload.emailVerified,
      google_id: payload.googleId,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Could not save prospect to Supabase.' } satisfies SubmitProspectResult,
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    id: data.id,
    message: 'Prospect saved successfully.',
  } satisfies SubmitProspectResult);
}
