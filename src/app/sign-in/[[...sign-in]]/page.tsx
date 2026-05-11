import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="dark dot-grid min-h-screen flex items-center justify-center px-6" style={{ background: '#09090b' }}>
      <SignIn />
    </div>
  );
}
