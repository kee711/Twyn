import { generatePageMetadata } from '@/lib/generatePageMetadata';
// import SignInClient from './SignInClient';
import SignInClientSimple from './SignInClientSimple';

export async function generateMetadata() {
  return await generatePageMetadata('signin');
}

export default function SignInPage() {
  // Temporarily use simple version for debugging
  return <SignInClientSimple />;
  // return <SignInClient />;
}