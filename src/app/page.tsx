import InviteLinkCopy from '@/components/InviteLinkCopy';
import ProspectPublicForm from '@/components/ProspectPublicForm';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ signin?: string }>;
}) {
  const params = await searchParams;
  const autoGoogleSignIn = params.signin === 'google';

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {!autoGoogleSignIn && <InviteLinkCopy />}
        <ProspectPublicForm autoGoogleSignIn={autoGoogleSignIn} />
      </div>
    </main>
  );
}
