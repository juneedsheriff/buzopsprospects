'use client';

import type { GoogleProspectLoginProps } from '@/types/google';
import { decodeGoogleCredential } from '@/lib/googleAuth';
import { Button } from '@mantine/core';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { IconBrandGoogle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleProspectLogin({ onSuccess, disabled = false }: GoogleProspectLoginProps) {
  const [loading, setLoading] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(400);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setButtonWidth(element.offsetWidth || 400);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const handleSuccess = useCallback((response: CredentialResponse) => {
    setLoading(true);

    try {
      if (!response.credential) {
        throw new Error('No credential received from Google.');
      }

      const user = decodeGoogleCredential(response.credential);
      onSuccess(user);
    }
    catch {
      notifications.show({
        title: 'Google sign-in failed',
        message: 'Could not process Google authentication. Please try again.',
        color: 'red',
      });
    }
    finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const handleError = useCallback(() => {
    setLoading(false);
    notifications.show({
      title: 'Google sign-in failed',
      message: 'Authentication was cancelled or failed. Please try again.',
      color: 'red',
    });
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="google-prospect-login relative h-10 w-full">
      <Button
        type="button"
        fullWidth
        loading={loading}
        disabled={disabled || loading}
        leftSection={!loading ? <IconBrandGoogle size={18} /> : undefined}
        variant="default"
        tabIndex={-1}
        aria-hidden={!loading}
        className="pointer-events-none absolute inset-0 h-10 rounded-[10px] border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-600 dark:bg-card dark:text-foreground"
      >
        Continue with Google
      </Button>

      {!loading && !disabled && (
        <div className="absolute inset-0 z-10 overflow-hidden opacity-[0.011]">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            auto_select={false}
            width={buttonWidth}
          />
        </div>
      )}
    </div>
  );
}

export default GoogleProspectLogin;
