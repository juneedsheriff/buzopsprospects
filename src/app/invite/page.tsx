import ProspectPublicForm from '@/components/ProspectPublicForm';

export default function InvitePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <ProspectPublicForm inviteMode autoGoogleSignIn />
      </div>
    </main>
  );
}
