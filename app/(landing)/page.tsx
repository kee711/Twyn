import { generatePageMetadata } from '@/lib/generatePageMetadata';
import HomeClient from './HomeClient';

export async function generateMetadata() {
  return await generatePageMetadata('home');
}

export default function Home() {
  return <HomeClient />;
}