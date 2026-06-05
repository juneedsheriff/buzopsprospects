/**
 * Integration snippet for ProspectsFormFields.tsx
 *
 * 1. Add `googleLoginSlot?: React.ReactNode` to the component props interface.
 * 2. Destructure `googleLoginSlot` in the component signature.
 * 3. Render the slot immediately before the email field block.
 */

import type { ReactNode } from 'react';

export interface ProspectsFormFieldsGoogleOAuthProps {
  googleLoginSlot?: ReactNode;
}

// --- Insert before the email field in ProspectsFormFields render: ---

/*
{googleLoginSlot && !showAdditional && (
  <div className="space-y-4">
    {googleLoginSlot}
    <div className="relative flex items-center py-1">
      <div className="grow border-t border-[#E2E8F0] dark:border-slate-600" />
      <span className="mx-3 shrink-0 text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-muted-foreground">
        or
      </span>
      <div className="grow border-t border-[#E2E8F0] dark:border-slate-600" />
    </div>
  </div>
)}
*/
