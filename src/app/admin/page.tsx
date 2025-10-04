'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/admin-panel';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in via localStorage
    const adminUser = localStorage.getItem('admin_user');
    
    if (!adminUser) {
      router.push('/sign-in');
      return;
    }

    try {
      const user = JSON.parse(adminUser);
      if (user.role === 'admin') {
        setIsAuthenticated(true);
      } else {
        router.push('/sign-in');
      }
    } catch (error) {
      router.push('/sign-in');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <AdminPanel />;
}