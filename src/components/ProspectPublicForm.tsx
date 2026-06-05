'use client';

import GoogleProspectLogin from '@/components/GoogleProspectLogin';
import { fetchGoogleProfileImageAsFile } from '@/lib/googleAuth';
import { verifyProspectEmail } from '@/lib/verifyEmail';
import type { GoogleUserProfile } from '@/types/google';
import {
  emptyProspectFormValues,
  type ProspectPublicFormValues,
} from '@/types/prospectForm';
import {
  Avatar,
  Button,
  FileInput,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ProspectPublicFormProps {
  /** Prospect-facing invite page with focused copy and auto Google sign-in. */
  inviteMode?: boolean;
  /** Prompt Google One Tap as soon as the page loads. */
  autoGoogleSignIn?: boolean;
}

function mapGoogleProfileToForm(user: GoogleUserProfile): ProspectPublicFormValues {
  return {
    email: user.email,
    firstName: user.givenName,
    lastName: user.familyName,
    fullName: user.fullName,
    phone: '',
    pictureUrl: user.picture ?? '',
    locale: user.locale,
    emailVerified: user.emailVerified ? 'Yes' : 'No',
    googleId: user.googleId,
  };
}

export default function ProspectPublicForm({
  inviteMode = false,
  autoGoogleSignIn = false,
}: ProspectPublicFormProps = {}) {
  const [form, setForm] = useState<ProspectPublicFormValues>(emptyProspectFormValues);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLookingUpEmail, setIsLookingUpEmail] = useState(false);
  const emailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVerifiedEmailRef = useRef('');
  const objectUrlRef = useRef<string | null>(null);

  const updateField = useCallback(<K extends keyof ProspectPublicFormValues>(
    field: K,
    value: ProspectPublicFormValues[K],
  ) => {
    setForm(current => ({ ...current, [field]: value }));
  }, []);

  const setPhotoPreview = useCallback((file: File | null, previewUrl?: string) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPhotoPreviewUrl(url);
      setPhotoFileName(file.name);
      return;
    }

    setPhotoPreviewUrl(previewUrl ?? null);
    setPhotoFileName(previewUrl ? 'google-profile.jpg' : '');
  }, []);

  const clearInviteQueryFromUrl = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);

    if (url.searchParams.has('signin')) {
      url.searchParams.delete('signin');
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  }, []);

  const applyGoogleProfile = useCallback(async (user: GoogleUserProfile) => {
    setIsLoadingProfile(true);
    setForm(mapGoogleProfileToForm(user));
    lastVerifiedEmailRef.current = user.email.toLowerCase();

    if (user.picture) {
      const profileFile = await fetchGoogleProfileImageAsFile(user.picture);

      if (profileFile) {
        setPhotoPreview(profileFile);
      }
      else {
        setPhotoPreview(null, user.picture);
        notifications.show({
          title: 'Profile photo preview only',
          message: 'Google profile loaded, but the photo file could not be downloaded. URL is still shown below.',
          color: 'yellow',
        });
      }
    }
    else {
      setPhotoPreview(null);
    }

    setIsLoadingProfile(false);
    clearInviteQueryFromUrl();

    notifications.show({
      title: inviteMode ? 'Profile ready' : 'Google profile loaded',
      message: inviteMode
        ? 'Your details are filled in. Review them below and continue.'
        : 'Public profile data and photo were filled from your Google account.',
      color: 'green',
    });
  }, [clearInviteQueryFromUrl, inviteMode, setPhotoPreview]);

  const lookupEmail = useCallback(async (value: string) => {
    const normalizedEmail = value.trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      return;
    }

    if (normalizedEmail === lastVerifiedEmailRef.current) {
      return;
    }

    setIsLookingUpEmail(true);

    try {
      const result = await verifyProspectEmail(normalizedEmail);
      lastVerifiedEmailRef.current = normalizedEmail;

      if (result.found && result.client) {
        setForm(current => ({
          ...current,
          email: result.client?.Email ?? current.email,
          firstName: result.client?.FirstName ?? current.firstName,
          lastName: result.client?.LastName ?? current.lastName,
          fullName: [result.client?.FirstName, result.client?.LastName].filter(Boolean).join(' '),
          phone: result.client?.Phone ?? current.phone,
        }));

        notifications.show({
          title: 'Existing client found',
          message: `${result.client.FirstName} ${result.client.LastName} is already in BuzOps.`,
          color: 'blue',
        });
        return;
      }

      if (result.message) {
        notifications.show({
          title: 'Email lookup',
          message: result.message,
          color: 'yellow',
        });
      }
    }
    catch {
      notifications.show({
        title: 'Email lookup failed',
        message: 'Could not verify this email. Try again or use Continue with Google.',
        color: 'red',
      });
    }
    finally {
      setIsLookingUpEmail(false);
    }
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    updateField('email', value);

    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }

    if (value.trim().toLowerCase() !== lastVerifiedEmailRef.current) {
      lastVerifiedEmailRef.current = '';
    }

    if (value.length >= 3 && value.includes('@')) {
      emailTimeoutRef.current = setTimeout(() => {
        void lookupEmail(value);
      }, 500);
    }
  }, [lookupEmail, updateField]);

  const handlePhotoUpload = useCallback((file: File | null) => {
    if (!file) {
      return;
    }

    updateField('pictureUrl', '');
    setPhotoPreview(file);
  }, [setPhotoPreview, updateField]);

  const handleRemovePhoto = useCallback(() => {
    updateField('pictureUrl', '');
    setPhotoPreview(null);
  }, [setPhotoPreview, updateField]);

  const handleClearForm = useCallback(() => {
    setForm(emptyProspectFormValues());
    setPhotoPreview(null);
    lastVerifiedEmailRef.current = '';
  }, [setPhotoPreview]);

  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const previewSource = photoPreviewUrl ?? (form.pictureUrl || null);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{inviteMode ? 'Complete your profile' : 'BuzOps Prospects'}</Title>
        <Text c="dimmed" size="sm" mt={4}>
          {inviteMode
            ? 'Sign in with Google to load your details instantly. Your form will update right away — no refresh needed.'
            : 'Sign in with Google to fetch public profile data and photo, or enter details manually.'}
        </Text>
      </div>

      <Paper withBorder radius="md" p="lg" shadow="sm">
        <Stack gap="md">
          <GoogleProspectLogin
            onSuccess={user => void applyGoogleProfile(user)}
            disabled={isLoadingProfile}
            autoPrompt={autoGoogleSignIn}
          />

          {autoGoogleSignIn && !form.email && !isLoadingProfile && (
            <Text size="sm" c="dimmed" ta="center">
              Google sign-in should appear automatically. If not, tap Continue with Google above.
            </Text>
          )}

          {isLoadingProfile && (
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Fetching Google profile and photo...</Text>
            </Group>
          )}

          <div className="relative flex items-center py-1">
            <div className="grow border-t border-[#E2E8F0]" />
            <span className="mx-3 shrink-0 text-xs font-medium uppercase tracking-wide text-[#64748B]">
              or enter manually
            </span>
            <div className="grow border-t border-[#E2E8F0]" />
          </div>

          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="name@example.com"
                  type="email"
                  value={form.email}
                  onChange={event => handleEmailChange(event.currentTarget.value)}
                  onBlur={event => void lookupEmail(event.currentTarget.value)}
                  rightSection={isLookingUpEmail ? <Loader size={16} /> : undefined}
                />
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="First name"
                      placeholder="First name"
                      value={form.firstName}
                      onChange={event => updateField('firstName', event.currentTarget.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Last name"
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={event => updateField('lastName', event.currentTarget.value)}
                    />
                  </Grid.Col>
                </Grid>
                <TextInput
                  label="Full name"
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={event => updateField('fullName', event.currentTarget.value)}
                />
                <TextInput
                  label="Phone"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={event => updateField('phone', event.currentTarget.value)}
                />
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Locale"
                      placeholder="en"
                      value={form.locale}
                      onChange={event => updateField('locale', event.currentTarget.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Email verified"
                      placeholder="Yes / No"
                      value={form.emailVerified}
                      onChange={event => updateField('emailVerified', event.currentTarget.value)}
                    />
                  </Grid.Col>
                </Grid>
                <TextInput
                  label="Google ID"
                  placeholder="Google account ID"
                  value={form.googleId}
                  readOnly
                />
                <TextInput
                  label="Profile photo URL"
                  placeholder="https://..."
                  value={form.pictureUrl}
                  onChange={event => {
                    updateField('pictureUrl', event.currentTarget.value);
                    setPhotoPreview(null, event.currentTarget.value || undefined);
                  }}
                />
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder radius="md" p="md" className="h-full">
                <Stack gap="md" align="center">
                  <Text fw={600} size="sm" w="100%">Profile photo</Text>

                  <Avatar
                    src={previewSource}
                    alt={form.fullName || 'Profile photo'}
                    size={120}
                    radius="md"
                  >
                    <IconPhoto size={40} />
                  </Avatar>

                  {photoFileName && (
                    <Text size="xs" c="dimmed" ta="center">{photoFileName}</Text>
                  )}

                  <FileInput
                    label="Upload photo"
                    placeholder="Choose image"
                    accept="image/png,image/jpeg,image/webp"
                    leftSection={<IconPhoto size={16} />}
                    onChange={handlePhotoUpload}
                    clearable
                    w="100%"
                  />

                  {previewSource && (
                    <Button
                      type="button"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={16} />}
                      onClick={handleRemovePhoto}
                      w="100%"
                    >
                      Remove photo
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button type="button" variant="default" onClick={handleClearForm}>
              Clear form
            </Button>
          </Group>

          {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <Text size="sm" c="orange">
              Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to enable Google sign-in.
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
