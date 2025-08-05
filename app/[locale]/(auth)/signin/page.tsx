import { generatePageMetadata } from '@/lib/generatePageMetadata';
import SignInClient from './SignInClient';

export async function generateMetadata() {
  return await generatePageMetadata('signin');
}

export default function SignInPage() {
  return <SignInClient />;
}