import { generatePageMetadata } from '@/lib/generatePageMetadata';
// import SignInClient from './SignInClient';
import SignInClientSafe from './SignInClientSafe';

export async function generateMetadata() {
  return await generatePageMetadata('signin');
}

export default function SignInPage() {
  // Use safe version without problematic hooks
  return <SignInClientSafe />;
}