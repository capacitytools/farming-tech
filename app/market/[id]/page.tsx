import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { MapPin, Phone, ShieldCheck } from 'lucide-react';

interface Props {
  params: { id: string };
}

export default async function ListingDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: listing } = await supabase
    .from('livestock_listings')
    .select('*, profiles(full_name, avatar_url, whatsapp, is_verified), tribes(name, icon)')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!listing) notFound();

  const seller = listing.profiles as any;
  const whatsappLink = seller?.whatsapp
    ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hi, I'm interested in your listing "${listing.title}" on Farming Tech & Business.`
      )}`
    : null;

  return (
    <div className="pb-8">
      <div className="relative w-full h-64">
        <Image
          src={listing.images?.[0] || '/images/placeholder-listing.jpg'}
          alt={listing.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {listing.images?.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3">
          {listing.images.slice(1).map((img: string, i: number) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={img} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold text-forest-900 dark:text-white">{listing.title}</h1>
          {listing.tribes && (
            <span className="flex-shrink-0 text-xs font-bold bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-200 px-2.5 py-1 rounded-full">
              {listing.tribes.icon} {listing.tribes.name}
            </span>
          )}
        </div>

        <p className="text-2xl font-extrabold text-forest-700 dark:text-gold-400 mt-2">
          {formatCurrency(listing.price, listing.currency)}
        </p>

        <div className="flex items-center gap-3 mt-2 text-xs text-forest-400">
          {listing.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {listing.location}</span>
          )}
          <span>{formatRelativeTime(listing.created_at)}</span>
        </div>

        {listing.description && (
          <div className="glass-card p-4 mt-4">
            <p className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2">Description</p>
            <p className="text-sm text-forest-600 dark:text-forest-300 whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {listing.breed && (
            <div className="glass-card-sm p-3">
              <p className="text-[11px] text-forest-400 font-semibold">Breed</p>
              <p className="text-sm font-bold text-forest-900 dark:text-white">{listing.breed}</p>
            </div>
          )}
          {listing.age && (
            <div className="glass-card-sm p-3">
              <p className="text-[11px] text-forest-400 font-semibold">Age</p>
              <p className="text-sm font-bold text-forest-900 dark:text-white">{listing.age}</p>
            </div>
          )}
          <div className="glass-card-sm p-3">
            <p className="text-[11px] text-forest-400 font-semibold">Quantity</p>
            <p className="text-sm font-bold text-forest-900 dark:text-white">{listing.quantity}</p>
          </div>
        </div>

        {/* Seller card */}
        <div className="glass-card p-4 mt-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center overflow-hidden flex-shrink-0">
            {seller?.avatar_url ? (
              <Image src={seller.avatar_url} alt="" width={44} height={44} className="object-cover" />
            ) : (
              <span className="text-base font-bold text-forest-600">
                {seller?.full_name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-forest-900 dark:text-white flex items-center gap-1">
              {seller?.full_name ?? 'Seller'}
              {seller?.is_verified && <ShieldCheck className="w-4 h-4 text-forest-600" />}
            </p>
            <p className="text-xs text-forest-400">Verified Seller</p>
          </div>
        </div>

        {whatsappLink ? (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-4">
            <Phone className="w-4 h-4" /> Contact Seller on WhatsApp
          </a>
        ) : (
          <div className="btn-secondary w-full mt-4 opacity-60 pointer-events-none">
            Seller contact unavailable
          </div>
        )}
      </div>
    </div>
  );
}
