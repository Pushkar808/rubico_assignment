'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Globe, Users, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { orgApi } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { extractApiError } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Org {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  owner_id: string;
  member_count?: number;
  created_at: string;
}

const defaultForm = { name: '', description: '', website: '', logo_url: '' };

export default function OrganizationsPage() {
  const { user } = useAuthStore();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Org | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchOrgs = async () => {
    setIsLoading(true);
      // fallback to all orgs
      try {
        const res = await orgApi.list();
        setOrgs(res.data.data?.organizations || []);
      } catch { /* noop */ } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const openCreate = () => {
    setEditingOrg(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (org: Org) => {
    setEditingOrg(org);
    setForm({ name: org.name, description: org.description || '', website: org.website || '', logo_url: org.logo_url || '' });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingOrg) {
        await orgApi.update(editingOrg.id, form);
        toast.success('Organization updated');
      } else {
        await orgApi.create(form);
        toast.success('Organization created');
      }
      setModalOpen(false);
      fetchOrgs();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (org: Org) => {
    if (!confirm(`Delete "${org.name}"? This will also delete all its events and products.`)) return;
    try {
      await orgApi.delete(org.id);
      toast.success('Organization deleted');
      fetchOrgs();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-500" />
            Organizations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your organizations</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Organization
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No organizations yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-6">Create your first organization to start posting events and products.</p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Create Organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orgs.map((org, idx) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <Avatar name={org.name} src={org.logo_url} size="lg" />
                  {org.owner_id === user?.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(org)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(org)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{org.name}</h3>
                {org.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{org.description}</p>
                )}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mb-3">
                    <Globe className="w-3 h-3" />
                    {org.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
              <div className="px-5 pb-4">
                <Link href={`/organizations/${org.id}`}>
                  <Button variant="secondary" size="sm" className="w-full gap-2">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Manage Events & Products
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOrg ? 'Edit Organization' : 'New Organization'}
      >
        <div className="space-y-4">
          <Input
            label="Organization name"
            placeholder="Acme Corp"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Textarea
            label="Description"
            placeholder="What does your organization do?"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://example.com"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
          <Input
            label="Logo URL"
            type="url"
            placeholder="https://example.com/logo.png"
            value={form.logo_url}
            onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editingOrg ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
