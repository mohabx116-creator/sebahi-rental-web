import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../lib/constants/routes';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-xl flex-col items-center justify-center px-4 py-12 text-center text-fixed">
      <section className="glass-panel p-8 rounded-[32px] w-full flex flex-col items-center shadow-xl">
        <SearchX size={48} className="text-tertiary" />
        <h1 className="mt-5 text-3xl font-black text-fixed">الصفحة غير موجودة</h1>
        <p className="mt-3 leading-8 text-fixed-dim">الرابط الذي تحاول فتحه غير متاح داخل بوابة إيجارات المنطقة المحيطة.</p>
        <div className="mt-6 flex justify-center">
          <Link className="rounded-full bg-tertiary hover:bg-tertiary/90 px-6 py-3 font-bold text-primary transition shadow-lg shadow-tertiary/20" to={ROUTES.RENTALS}>
            العودة إلى الإيجارات
          </Link>
        </div>
      </section>
    </main>
  );
}
