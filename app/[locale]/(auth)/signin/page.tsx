import { generatePageMetadata } from '@/lib/generatePageMetadata';
// import SignInClient from './SignInClient';
// import SignInClientSafe from './SignInClientSafe';
import SignInClientSimple from './SignInClientSimple';

export async function generateMetadata() {
  return await generatePageMetadata('signin');
}

export default function SignInPage() {
  // Use simplest version that works
  return <SignInClientSimple />;
}