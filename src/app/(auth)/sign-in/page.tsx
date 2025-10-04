'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const signIn = async () => {
    setLoading(true);
    setError('');

    try {
      // Simple check against our admins table
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

      if (error || !data) {
        setError('Invalid username or password');
        return;
      }

      // Store admin session in localStorage
      localStorage.setItem('admin_user', JSON.stringify({
        id: data.id,
        username: data.username,
        role: data.role
      }));

      // Redirect to admin panel
      router.push('/admin');
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Admin Sign In</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the FootyVerse admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>

          <Button 
            onClick={signIn} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {error && (
            <div className="p-3 rounded-md text-sm bg-red-100 text-red-800">
              {error}
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-100 rounded-md">
            <h3 className="font-semibold text-blue-800">Default Admin Credentials</h3>
            <p className="text-sm text-blue-700 mt-1">
              Username: <code className="bg-blue-200 px-1 rounded">admin</code><br/>
              Password: <code className="bg-blue-200 px-1 rounded">admin123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}