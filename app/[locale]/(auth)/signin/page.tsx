import { generatePageMetadata } from '@/lib/generatePageMetadata';
import SignInClient from './SignInClient';
// import SignInClientSimple from './SignInClientSimple';

export async function generateMetadata() {
  return await generatePageMetadata('signin');
}

export default function SignInPage() {
  // Use original SignInClient with error handling
  return <SignInClient />;
  // return <SignInClientSimple />;
}