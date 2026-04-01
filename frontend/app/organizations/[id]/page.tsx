'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Calendar, Package, Edit2, Trash2,
  Globe, MapPin, Wifi, Users, DollarSign, Tag, Star,
} from 'lucide-react';
import { orgApi, eventApi, productApi } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, formatDateTime, formatPrice, extractApiError } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Org {
  id: string; name: string; description: string | null;
  website: string | null; logo_url: string | null; owner_id: string;
}

interface Event {
  id: string; title: string; description: string | null; category: string | null;
  tags: string[]; location: string | null; is_virtual: boolean;
  start_date: string | null; end_date: string | null; price: number;
  capacity: number | null; registered_count: number; image_url: string | null;
  status: string; likes_count: number;
}

interface Product {
  id: string; title: string; description: string | null; category: string | null;
  tags: string[]; price: number; stock: number | null; image_url: string | null;
  status: string; likes_count: number;
}

const defaultEvent = {
  title: '', description: '', category: '', tags: '',
  location: '', is_virtual: false, start_date: '', end_date: '',
  price: '0', capacity: '', image_url: '', status: 'published',
};

const defaultProduct = {
  title: '', description: '', category: '', tags: '',
  price: '0', stock: '', image_url: '', status: 'active',
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const orgId = params.id as string;

  const [org, setOrg] = useState<Org | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<'events' | 'products'>('events');
  const [isLoading, setIsLoading] = useState(true);

  // Event modal state
  const [eventModal, setEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState(defaultEvent);
  const [savingEvent, setSavingEvent] = useState(false);

  // Product modal state
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(defaultProduct);
  const [savingProduct, setSavingProduct] = useState(false);

  const isOwner = org?.owner_id === user?.id;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orgRes, eventsRes, productsRes] = await Promise.all([
        orgApi.get(orgId),
        eventApi.list(orgId, { limit: 50 }),
        productApi.list(orgId, { limit: 50 }),
      ]);
      setOrg(orgRes.data.data);
      setEvents(eventsRes.data.data?.events || []);
      setProducts(productsRes.data.data?.products || []);
    } catch {
      toast.error('Failed to load organization');
      router.push('/organizations');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Event CRUD ─────────────────────────────────────────────────────────────
  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventForm(defaultEvent);
    setEventModal(true);
  };

  const openEditEvent = (ev: Event) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title, description: ev.description || '', category: ev.category || '',
      tags: ev.tags?.join(', ') || '', location: ev.location || '',
      is_virtual: ev.is_virtual, start_date: ev.start_date?.slice(0, 16) || '',
      end_date: ev.end_date?.slice(0, 16) || '', price: String(ev.price),
      capacity: ev.capacity ? String(ev.capacity) : '', image_url: ev.image_url || '',
      status: ev.status,
    });
    setEventModal(true);
  };

  const toISOOrUndefined = (val: string) => {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const saveEvent = async () => {
    if (!eventForm.title.trim()) { toast.error('Title is required'); return; }
    setSavingEvent(true);
    try {
      const payload = {
        ...eventForm,
        tags: eventForm.tags ? eventForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        price: Number(eventForm.price) || 0,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : null,
        start_date: toISOOrUndefined(eventForm.start_date),
        end_date: toISOOrUndefined(eventForm.end_date),
      };
      if (editingEvent) {
        await eventApi.update(orgId, editingEvent.id, payload);
        toast.success('Event updated');
      } else {
        await eventApi.create(orgId, payload);
        toast.success('Event created');
      }
      setEventModal(false);
      fetchAll();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSavingEvent(false);
    }
  };

  const deleteEvent = async (ev: Event) => {
    if (!confirm(`Delete event "${ev.title}"?`)) return;
    try {
      await eventApi.delete(orgId, ev.id);
      toast.success('Event deleted');
      fetchAll();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  // ── Product CRUD ───────────────────────────────────────────────────────────
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(defaultProduct);
    setProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      title: p.title, description: p.description || '', category: p.category || '',
      tags: p.tags?.join(', ') || '', price: String(p.price),
      stock: p.stock !== null ? String(p.stock) : '', image_url: p.image_url || '',
      status: p.status,
    });
    setProductModal(true);
  };

  const saveProduct = async () => {
    if (!productForm.title.trim()) { toast.error('Title is required'); return; }
    setSavingProduct(true);
    try {
      const payload = {
        ...productForm,
        tags: productForm.tags ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        price: Number(productForm.price) || 0,
        stock: productForm.stock ? Number(productForm.stock) : null,
      };
      if (editingProduct) {
        await productApi.update(orgId, editingProduct.id, payload);
        toast.success('Product updated');
      } else {
        await productApi.create(orgId, payload);
        toast.success('Product created');
      }
      setProductModal(false);
      fetchAll();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Delete product "${p.title}"?`)) return;
    try {
      await productApi.delete(orgId, p.id);
      toast.success('Product deleted');
      fetchAll();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!org) return null;

  return (
    <AppLayout>
      {/* Back */}
      <Link href="/organizations" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Organizations
      </Link>

      {/* Org header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <Avatar name={org.name} src={org.logo_url} size="xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{org.name}</h1>
          {org.description && <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{org.description}</p>}
          {org.website && (
            <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
              <Globe className="w-3 h-3" />
              {org.website}
            </a>
          )}
        </div>
        <div className="flex gap-3 sm:flex-col sm:items-end text-center sm:text-right">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
            <p className="text-xs text-gray-500">Events</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
            <p className="text-xs text-gray-500">Products</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
          {(['events', 'products'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                tab === t
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {t === 'events' ? <><Calendar className="w-3.5 h-3.5 inline mr-1.5" /></> : <><Package className="w-3.5 h-3.5 inline mr-1.5" /></>}
              {t} ({t === 'events' ? events.length : products.length})
            </button>
          ))}
        </div>

        {isOwner && (
          <Button
            size="sm"
            onClick={tab === 'events' ? openCreateEvent : openCreateProduct}
          >
            <Plus className="w-3.5 h-3.5" />
            Add {tab === 'events' ? 'Event' : 'Product'}
          </Button>
        )}
      </div>

      {/* Events Tab */}
      {tab === 'events' && (
        <div>
          {events.length === 0 ? (
            <Empty icon={<Calendar />} text="No events yet" action={isOwner ? openCreateEvent : undefined} actionLabel="Create first event" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev, idx) => (
                <EventCard key={ev.id} event={ev} idx={idx} isOwner={isOwner} onEdit={() => openEditEvent(ev)} onDelete={() => deleteEvent(ev)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div>
          {products.length === 0 ? (
            <Empty icon={<Package />} text="No products yet" action={isOwner ? openCreateProduct : undefined} actionLabel="Add first product" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} idx={idx} isOwner={isOwner} onEdit={() => openEditProduct(p)} onDelete={() => deleteProduct(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Modal */}
      <Modal isOpen={eventModal} onClose={() => setEventModal(false)} title={editingEvent ? 'Edit Event' : 'New Event'} size="lg">
        <div className="space-y-4">
          <Input label="Title *" value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title" />
          <Textarea label="Description" rows={3} value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe your event…" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Category" value={eventForm.category} onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))} placeholder="Tech, Music, etc." />
            <Input label="Tags (comma-separated)" value={eventForm.tags} onChange={(e) => setEventForm((f) => ({ ...f, tags: e.target.value }))} placeholder="ai, web3, design" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date & time" type="datetime-local" value={eventForm.start_date} onChange={(e) => setEventForm((f) => ({ ...f, start_date: e.target.value }))} />
            <Input label="End date & time" type="datetime-local" value={eventForm.end_date} onChange={(e) => setEventForm((f) => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Location" value={eventForm.location} onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))} placeholder="City or venue" />
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="is_virtual"
                checked={eventForm.is_virtual}
                onChange={(e) => setEventForm((f) => ({ ...f, is_virtual: e.target.checked }))}
                className="w-4 h-4 text-primary-600 rounded border-gray-300"
              />
              <label htmlFor="is_virtual" className="text-sm text-gray-700 dark:text-gray-300">Virtual event</label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Price (₹)" type="number" min="0" value={eventForm.price} onChange={(e) => setEventForm((f) => ({ ...f, price: e.target.value }))} />
            <Input label="Capacity" type="number" min="1" value={eventForm.capacity} onChange={(e) => setEventForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="Unlimited" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select
                value={eventForm.status}
                onChange={(e) => setEventForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <Input label="Image URL" type="url" value={eventForm.image_url} onChange={(e) => setEventForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setEventModal(false)}>Cancel</Button>
            <Button onClick={saveEvent} isLoading={savingEvent}>{editingEvent ? 'Save changes' : 'Create event'}</Button>
          </div>
        </div>
      </Modal>

      {/* Product Modal */}
      <Modal isOpen={productModal} onClose={() => setProductModal(false)} title={editingProduct ? 'Edit Product' : 'New Product'} size="lg">
        <div className="space-y-4">
          <Input label="Title *" value={productForm.title} onChange={(e) => setProductForm((f) => ({ ...f, title: e.target.value }))} placeholder="Product name" />
          <Textarea label="Description" rows={3} value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe your product…" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Category" value={productForm.category} onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))} placeholder="Electronics, Fashion, etc." />
            <Input label="Tags (comma-separated)" value={productForm.tags} onChange={(e) => setProductForm((f) => ({ ...f, tags: e.target.value }))} placeholder="wireless, premium" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Price (₹)" type="number" min="0" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))} />
            <Input label="Stock" type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm((f) => ({ ...f, stock: e.target.value }))} placeholder="Unlimited" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select
                value={productForm.status}
                onChange={(e) => setProductForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <Input label="Image URL" type="url" value={productForm.image_url} onChange={(e) => setProductForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setProductModal(false)}>Cancel</Button>
            <Button onClick={saveProduct} isLoading={savingProduct}>{editingProduct ? 'Save changes' : 'Create product'}</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Empty({ icon, text, action, actionLabel }: { icon: React.ReactNode; text: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-600 mb-4">
        {icon}
      </div>
      <p className="text-gray-500 dark:text-gray-400 font-medium text-base">{text}</p>
      {action && actionLabel && (
        <Button className="mt-4" size="sm" onClick={action}>
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function EventCard({ event, idx, isOwner, onEdit, onDelete }: { event: Event; idx: number; isOwner: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.04 }}
      className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant="event"><Calendar className="w-3 h-3" />Event</Badge>
        <Badge variant={event.status === 'published' ? 'success' : event.status === 'draft' ? 'warning' : 'danger'}>
          {event.status}
        </Badge>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">{event.title}</h3>
      {event.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{event.description}</p>}
      <div className="space-y-1 mb-3">
        {event.start_date && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Calendar className="w-3 h-3" />{formatDate(event.start_date)}</div>}
        {event.location && <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="w-3 h-3" />{event.is_virtual ? 'Virtual' : event.location}</div>}
        {event.capacity && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Users className="w-3 h-3" />{event.registered_count}/{event.capacity}</div>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(event.price)}</span>
        {isOwner && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProductCard({ product, idx, isOwner, onEdit, onDelete }: { product: Product; idx: number; isOwner: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.04 }}
      className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant="product"><Package className="w-3 h-3" />Product</Badge>
        <Badge variant={product.status === 'active' ? 'success' : 'warning'}>{product.status}</Badge>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">{product.title}</h3>
      {product.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{product.description}</p>}
      <div className="space-y-1 mb-3">
        {product.category && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Tag className="w-3 h-3" />{product.category}</div>}
        {product.stock !== null && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Package className="w-3 h-3" />{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
        {isOwner && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
