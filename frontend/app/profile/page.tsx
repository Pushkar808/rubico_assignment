'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Save, Shield, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/Avatar';
import { extractApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', avatar_url: user?.avatar_url || '' });
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ name: form.name, avatar_url: form.avatar_url || undefined });
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-primary-500" />
          Profile
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
        >
          {/* Cover / Avatar */}
          <div className="h-24 bg-gradient-to-r from-primary-500 to-indigo-600" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-8 mb-4">
              <div className="relative">
                <Avatar name={user.name} src={user.avatar_url} size="xl" className="ring-4 ring-white dark:ring-gray-900" />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-2">
                <Shield className="w-3.5 h-3.5" />
                Member since {formatDate(user.created_at)}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="Your full name"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  {user.email}
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <Input
                label="Avatar URL"
                type="url"
                value={form.avatar_url}
                onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
                leftIcon={<Camera className="w-4 h-4" />}
                placeholder="https://example.com/avatar.jpg"
              />
              {form.avatar_url && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Avatar name={user.name} src={form.avatar_url} size="md" />
                  <p className="text-sm text-gray-500">Preview</p>
                </div>
              )}
              <Button type="submit" isLoading={saving} className="w-full gap-2">
                <Save className="w-4 h-4" />
                Save changes
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Danger zone */}
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account</h2>
          <Button
            variant="danger"
            onClick={handleLogout}
            isLoading={loggingOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
