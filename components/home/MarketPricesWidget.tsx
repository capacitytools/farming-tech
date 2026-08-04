import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export interface PriceRow {
  name: string;
  emoji: string;
  price: number;
  trend: 'up' | 'down' | 'flat';
  unit: string;
}

// In production this pulls from a `market_prices` table updated by admin/cron.
const DEFAULT_PRICES: PriceRow[] = [
  { name: 'Broiler Chicken', emoji: '🐔', price: 8500, trend: 'up', unit: 'per bird' },
  { name: 'Goat (Mature)', emoji: '🐐', price: 65000, trend: 'flat', unit: 'each' },
  { name: 'Catfish', emoji: '🐟', price: 1800, trend: 'down', unit: 'per kg' },
  { name: 'Rabbit (Breeder)', emoji: '🐰', price: 12000, trend: 'up', unit: 'each' },
];

export default function MarketPricesWidget({ prices = DEFAULT_PRICES }: { prices?: PriceRow[] }) {
  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="app-heading">Today's Market Prices</h2>
        <Link href="/market" className="text-sm font-bold text-forest-600 dark:text-gold-400">
          Full Market
        </Link>
      </div>

      <div className="glass-card p-2">
        {prices.map((row, i) => {
          const TrendIcon = row.trend === 'up' ? TrendingUp : row.trend === 'down' ? TrendingDown : Minus;
          const trendColor =
            row.trend === 'up' ? 'text-forest-600' : row.trend === 'down' ? 'text-red-500' : 'text-forest-300';

          return (
            <div
              key={row.name}
              className={cn(
                'flex items-center justify-between px-3 py-3',
                i !== prices.length - 1 && 'border-b border-forest-100 dark:border-forest-700/50'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{row.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-forest-900 dark:text-white">{row.name}</p>
                  <p className="text-xs text-forest-400">{row.unit}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-extrabold text-forest-900 dark:text-white">
                  {formatCurrency(row.price)}
                </p>
                <TrendIcon className={cn('w-4 h-4', trendColor)} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
