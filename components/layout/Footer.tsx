import { Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

// Real social links — update here if any of these ever change
const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://www.facebook.com/myFarmTech', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/myfarmtech', label: 'Instagram' },
  { icon: Youtube, href: 'https://www.youtube.com/@AnimalsTipss', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="px-4 py-8 mt-6 border-t border-forest-100 dark:border-forest-800">
      <div className="glass-card-sm p-5 mb-5">
        <p className="font-bold text-forest-900 dark:text-white mb-3">Contact Admin</p>
        <div className="space-y-2.5">
          <a
            href="https://wa.me/2349159884244"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-sm font-semibold text-forest-700 dark:text-forest-200"
          >
            <span className="w-8 h-8 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
              <Phone className="w-4 h-4 text-forest-600 dark:text-gold-400" />
            </span>
            +234 915 988 4244 (WhatsApp)
          </a>
          <a
            href="mailto:myrabbit101@gmail.com"
            className="flex items-center gap-2.5 text-sm font-semibold text-forest-700 dark:text-forest-200"
          >
            <span className="w-8 h-8 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
              <Mail className="w-4 h-4 text-forest-600 dark:text-gold-400" />
            </span>
            myrabbit101@gmail.com
          </a>
        </div>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        {SOCIAL_LINKS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="w-10 h-10 rounded-full bg-forest-50 dark:bg-forest-800 flex items-center justify-center"
          >
            <s.icon className="w-4.5 h-4.5 text-forest-600 dark:text-forest-200" />
          </a>
        ))}
      </div>

      <p className="text-center text-xs text-forest-400">
        © {new Date().getFullYear()} Farming Tech & Business. All rights reserved.
      </p>
    </footer>
  );
}
