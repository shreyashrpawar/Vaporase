import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="noise-bg gradient-bg min-h-screen flex items-center justify-center px-6">
      <SignUp />
    </div>
  );
}
