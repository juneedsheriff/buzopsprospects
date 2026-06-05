import type { ProspectPublicFormValues } from '@/types/prospectForm';
import type { SubmitProspectResult } from '@/types/prospectSubmit';

export class ProspectSubmitError extends Error {
  readonly code: 'duplicate_email' | 'unknown';

  constructor(message: string, code: 'duplicate_email' | 'unknown' = 'unknown') {
    super(message);
    this.name = 'ProspectSubmitError';
    this.code = code;
  }
}

export async function submitProspect(
  values: ProspectPublicFormValues,
  photoFile?: File | null,
): Promise<SubmitProspectResult> {
  const formData = new FormData();
  formData.append('data', JSON.stringify(values));

  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const response = await fetch('/api/prospects/submit', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json() as SubmitProspectResult;

  if (!response.ok || !result.success) {
    const message = result.message ?? 'Could not save prospect.';

    if (response.status === 409) {
      throw new ProspectSubmitError(message, 'duplicate_email');
    }

    throw new ProspectSubmitError(message);
  }

  return result;
}
