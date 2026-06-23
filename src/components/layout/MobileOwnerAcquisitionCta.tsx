import { Building2, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/constants/routes';

const ownerAcquisitionCopy = {
  stickyTitle: 'أعلن عن وحدتك للإيجار',
  stickyDescription: 'أضف بيانات وحدتك وسنتواصل معك',
  inlineTitle: 'عندك وحدة للإيجار؟',
  inlineCta: 'أعلن عن وحدتك',
  inlineDescription: 'أضف بيانات وحدتك وسنتواصل معك',
} as const;

export function MobileOwnerAcquisitionCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
      <div className="mx-auto max-w-7xl">
        <Link
          to={ROUTES.OWNER_LIST_UNIT}
          className="flex min-h-16 items-center justify-between gap-4 rounded-[28px] border border-[#d6b25e]/35 bg-[#091b16]/96 px-4 py-3 text-right text-white shadow-[0_-18px_40px_rgba(9,27,22,0.26)] backdrop-blur-md transition hover:border-[#d6b25e]/55 hover:bg-[#071614]"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-black leading-6 text-white">{ownerAcquisitionCopy.stickyTitle}</p>
            <p className="mt-0.5 text-xs font-medium leading-5 text-white/72">{ownerAcquisitionCopy.stickyDescription}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d6b25e] text-[#071614] shadow-lg shadow-[#d6b25e]/20">
            <Megaphone className="h-5 w-5" />
          </span>
        </Link>
      </div>
    </div>
  );
}

export function InlineOwnerAcquisitionCta() {
  return (
    <div className="md:hidden">
      <Link
        to={ROUTES.OWNER_LIST_UNIT}
        className="block rounded-[24px] border border-[#d6b25e]/30 bg-gradient-to-br from-[#fdfaf4] to-[#eef5ef] p-4 text-right shadow-[0_18px_40px_rgba(28,45,34,0.08)] transition hover:border-[#d6b25e]/45 hover:shadow-[0_20px_48px_rgba(28,45,34,0.1)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-black leading-6 text-[#1f2c22]">{ownerAcquisitionCopy.inlineTitle}</p>
            <p className="mt-1 text-xs leading-5 text-[#5f6e62]">{ownerAcquisitionCopy.inlineDescription}</p>
            <span className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-5 py-2.5 text-sm font-black text-primary shadow-lg shadow-tertiary/15">
              {ownerAcquisitionCopy.inlineCta}
            </span>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8a6d22] shadow-sm">
            <Building2 className="h-5 w-5" />
          </span>
        </div>
      </Link>
    </div>
  );
}
