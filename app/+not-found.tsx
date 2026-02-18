import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to index on not found
    router.replace('/');
  }, [router]);

  return null;
}
