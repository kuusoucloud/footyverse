'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [created, setCreated] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
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
          email: 'admin@footyverse.com', 
          password: 'adminb23456',
          admin_secret: adminSecret
        }
      });
      
      if (error) throw error;
      setStatus(`✅ ${data.message}`);
      setCreated(true);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const signInAsAdmin = async () => {
    setLoading(true);
    setStatus('Signing in as admin...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@footyverse.com',
        password: 'adminb23456'
      });
      
      if (error) throw error;
      setStatus('✅ Signed in successfully! Redirecting to admin panel...');
      
      // Redirect to admin panel
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    } catch (error) {
      setStatus(`❌ Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔒 Secure Admin Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Admin Secret Key</Label>
            <Input
              type="password"
              placeholder="Enter admin secret key"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              disabled={created}
            />
            <div className="text-xs text-gray-500">
              Required to prevent unauthorized admin creation
            </div>
          </div>

          <div className="space-y-2">
            <Label>Admin Credentials</Label>
            <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
              <div><strong>Email:</strong> admin@footyverse.com</div>
              <div><strong>Password:</strong> adminb23456</div>
            </div>
          </div>

          {!created ? (
            <Button 
              onClick={createAdmin} 
              disabled={loading || !adminSecret.trim()}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Admin Account'}
            </Button>
          ) : (
            <Button 
              onClick={signInAsAdmin} 
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </Button>
          )}

          {status && (
            <div className="p-3 bg-gray-100 rounded text-sm font-mono">
              {status}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>🔒 Security:</strong></p>
            <p>• Admin secret key required</p>
            <p>• Only one admin account allowed</p>
            <p>• Prevents unauthorized access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}