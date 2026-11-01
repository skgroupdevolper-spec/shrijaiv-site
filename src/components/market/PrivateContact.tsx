import { Mail, Phone, MapPin, Globe, MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/utils';
import UnlockButton from './UnlockButton';

type Contact = { email?: string | null; phone?: string | null; whatsapp?: string | null; address?: string | null; website?: string | null };

/** Contact details when unlocked; otherwise the "Show contact details" button (free allowance / pay per contact) */
export default function PrivateContact({ unlocked, contact, kind, id, waText, signIn }: { unlocked: boolean; contact: Contact; kind: 'inquiry' | 'requirement' | 'seller'; id: string; waText?: string; signIn?: string | null }) {
  if (!unlocked) {
    if (signIn)
      return (
        <a href={signIn} className="mt-3 block rounded-2xl bg-amber-50/70 p-4 text-sm ring-1 ring-amber-200/70">
          <span className="font-bold text-gray-900">Mobile, e-mail and address are private.</span>
          <span className="mt-1 block text-xs text-gray-600">Sign in as a buyer to see them — your first contacts are free.</span>
        </a>
      );
    return <UnlockButton kind={kind} id={id} className="mt-3" />;
  }
  const wa = contact.whatsapp || contact.phone;
  const rows = [
    contact.phone && { I: Phone, v: contact.phone, href: `tel:${contact.phone}` },
    contact.email && { I: Mail, v: contact.email, href: `mailto:${contact.email}` },
    contact.website && { I: Globe, v: contact.website.replace(/^https?:\/\//, ''), href: contact.website.startsWith('http') ? contact.website : `https://${contact.website}` },
    contact.address && { I: MapPin, v: contact.address, href: '' },
  ].filter(Boolean) as { I: any; v: string; href: string }[];
  if (!rows.length && !wa) return <p className="mt-3 text-xs text-gray-500">No contact details on file — please write in the conversation.</p>;
  return (
    <div className="mt-3 space-y-1.5 text-sm">
      {rows.map(({ I, v, href }) =>
        href ? (
          <a key={v} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-start gap-2 break-all text-gray-700 hover:text-gold-deep">
            <I className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" /> {v}
          </a>
        ) : (
          <p key={v} className="flex items-start gap-2 text-gray-700">
            <I className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" /> {v}
          </p>
        ),
      )}
      {wa && (
        <a href={waLink(wa, waText || 'Hello, I found you on SHRIJAIV.')} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-1 w-full">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      )}
    </div>
  );
}
