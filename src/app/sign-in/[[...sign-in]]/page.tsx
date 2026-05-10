import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="noise-bg gradient-bg min-h-screen flex items-center justify-center px-6">
      <SignIn />
    </div>
  );
}
