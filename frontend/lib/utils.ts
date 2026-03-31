import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy · h:mm a');
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isUpcoming(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(d, new Date());
}

export function isPast(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date());
}

export function formatPrice(price: number | string | null | undefined): string {
  const n = Number(price ?? 0);
  if (n === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function truncate(text: string, max = 120): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function getInitials(name: string): string {
  return name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function extractApiError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || 'Something went wrong';
  }
  return 'Something went wrong';
}

export const AVATAR_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-cyan-500',
];

export function avatarGradient(seed: string): string {
  const idx =seed? seed.charCodeAt(0) % AVATAR_COLORS.length:0;
  return AVATAR_COLORS[idx];
}
