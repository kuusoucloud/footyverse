'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateAdminPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [created, setCreated] = useState(false);

  const supabase = createClient();

  const createAdmin = async () => {
    if (!adminSecret.trim()) {
      setStatus('❌ Admin secret is required');
      return;
    }

    setLoading(true);
    setStatus('Creating admin account...');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-create-admin', {
        body: { 
          username,
          password,
          admin_secret: adminSecret
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      setStatus(`✅ ${data.message}`);
      setCreated(true);
    } catch (error) {
      console.error('Full error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Admin Account</CardTitle>
          <CardDescription className="text-center">
            Set up the initial admin user for FootyVerse
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
              disabled={created}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
              disabled={created}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Admin Secret</label>
            <Input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter admin secret key"
              disabled={created}
            />
          </div>
          
          <Button 
            onClick={createAdmin} 
            disabled={loading || created}
            className="w-full"
          >
            {loading ? 'Creating...' : created ? 'Admin Created ✅' : 'Create Admin Account'}
          </Button>
          
          {status && (
            <div className={`p-3 rounded-md text-sm ${
              status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status}
            </div>
          )}
          
          {created && (
            <div className="mt-4 p-4 bg-blue-100 rounded-md">
              <h3 className="font-semibold text-blue-800">Admin Account Created!</h3>
              <p className="text-sm text-blue-700 mt-1">
                Username: <code className="bg-blue-200 px-1 rounded">{username}</code><br/>
                You can now sign in to the admin panel.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}