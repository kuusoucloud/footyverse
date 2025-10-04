import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminPanel from '@/components/admin-panel';

export default async function AdminPage() {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/sign-in?message=Admin access requires authentication');
  }

  // Check if user is admin (you can customize this logic)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // For now, allow any authenticated user - you can restrict to specific roles
  // if (profile?.role !== 'admin') {
  //   redirect('/dashboard?message=Admin access denied');
  // }

  return <AdminPanel />;
}