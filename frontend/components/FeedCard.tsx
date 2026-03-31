'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, Bookmark, Calendar, MapPin, Package, Tag, Users, Wifi, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatDate, formatDateTime, formatPrice, truncate, isUpcoming } from '@/lib/utils';
import type { FeedItem } from '@/store/feed';

interface FeedCardProps {
  item: FeedItem;
  onLike: () => void;
  onSave: () => void;
  onRegister?: () => void;
  index?: number;
}

export function FeedCard({ item, onLike, onSave, onRegister, index = 0 }: FeedCardProps) {
  const isEvent = item.item_type === 'event';
  const upcoming = isEvent && isUpcoming(item.start_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden flex-shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            isEvent
              ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20'
              : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
          )}>
            {isEvent
              ? <Calendar className="w-12 h-12 text-violet-400" />
              : <Package className="w-12 h-12 text-emerald-400" />
            }
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={isEvent ? 'event' : 'product'}>
            {isEvent ? <Calendar className="w-3 h-3" /> : <Package className="w-3 h-3" />}
            {isEvent ? 'Event' : 'Product'}
          </Badge>
        </div>

        {/* Upcoming badge */}
        {upcoming && (
          <div className="absolute top-3 right-3">
            <Badge variant="success">
              <Clock className="w-3 h-3" />
              Upcoming
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Org */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={item.org_name} src={item.org_logo} size="xs" />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.org_name}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-1.5 line-clamp-2">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {truncate(item.description, 100)}
          </p>
        )}

        {/* Meta */}
        <div className="space-y-1 mb-3">
          {isEvent && item.start_date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDate(item.start_date)}</span>
            </div>
          )}
          {isEvent && item.location && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {item.is_virtual ? <Wifi className="w-3.5 h-3.5 flex-shrink-0" /> : <MapPin className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="truncate">{item.is_virtual ? 'Virtual' : item.location}</span>
            </div>
          )}
          {isEvent && item.capacity && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{item.registered_count ?? 0} / {item.capacity} registered</span>
            </div>
          )}
          {!isEvent && item.stock !== null && item.stock !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Package className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded text-xs">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className={cn(
            'font-semibold text-sm',
            Number(item.price) === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
          )}>
            {formatPrice(item.price)}
          </span>

          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                item.is_liked
                  ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-rose-500'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', item.is_liked && 'fill-current')} />
              <span>{item.likes_count}</span>
            </button>

            {/* Save */}
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                item.is_saved
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600'
              )}
            >
              <Bookmark className={cn('w-3.5 h-3.5', item.is_saved && 'fill-current')} />
              <span>{item.saves_count}</span>
            </button>

            {/* Register (events only) */}
            {isEvent && onRegister && (
              <button
                onClick={(e) => { e.stopPropagation(); onRegister(); }}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  item.is_registered
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                )}
              >
                {item.is_registered ? 'Registered' : 'Register'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
