import type { ProspectPublicFormValues } from '@/types/prospectForm';
import type { SubmitProspectResult } from '@/types/prospectSubmit';

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
    throw new Error(result.message ?? 'Could not save prospect.');
  }

  return result;
}
