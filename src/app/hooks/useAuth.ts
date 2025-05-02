// hooks/useAuth.ts
import { useEffect, useState } from 'react';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('id_token');
    setIsLoggedIn(!!token);
  }, []);

  return { isLoggedIn };
}
