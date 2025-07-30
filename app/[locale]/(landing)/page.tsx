import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('./HomeClient'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Home() {
  return <HomeClient />;
}