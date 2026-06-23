import { Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/constants/routes';

export function MobileOwnerAcquisitionCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
      <div className="mx-auto max-w-7xl">
        <Link
          to={ROUTES.OWNER_LIST_UNIT}
          className="flex min-h-16 items-center justify-between gap-4 rounded-[28px] border border-[#d6b25e]/35 bg-[#091b16]/96 px-4 py-3 text-right text-white shadow-[0_-18px_40px_rgba(9,27,22,0.26)] backdrop-blur-md transition hover:border-[#d6b25e]/55 hover:bg-[#071614]"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-black leading-6 text-white">أعلن عن وحدتك للإيجار</p>
            <p className="mt-0.5 text-xs font-medium leading-5 text-white/72">أضف بيانات وحدتك وسنتواصل معك</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d6b25e] text-[#071614] shadow-lg shadow-[#d6b25e]/20">
            <Megaphone className="h-5 w-5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
