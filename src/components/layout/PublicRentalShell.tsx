import { Home, Megaphone } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import dalilSubhiLogo from '../../assets/dalil-subhi-logo.jpg';
import { ROUTES } from '../../lib/constants/routes';

export function PublicRentalShell() {
  return (
    <div className="rentals-light min-h-dvh bg-[#f7f2e8] font-sans text-[#1f2c22]">
      <header className="sticky top-0 z-40 border-b border-[#e4dac5] bg-white/80 shadow-[0_12px_40px_rgba(28,45,34,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to={ROUTES.RENTALS}>
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[#e4dac5] bg-white shadow-lg shadow-[0_10px_30px_rgba(28,45,34,0.08)]">
              <img src={dalilSubhiLogo} alt="دليل السبحي" className="h-full w-full object-contain mix-blend-multiply" />
            </span>
            <div className="text-right">
              <p className="text-sm font-black text-[#1f2c22] sm:text-base">إيجارات المنطقة</p>
              <p className="hidden text-xs font-medium text-[#5f6e62] sm:block">بوابة متخصصة للإيجارات للمنطقة</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm font-bold text-[#1f2c22]">
            <Link
              className="hidden items-center gap-2 rounded-full px-4 py-2 transition duration-200 hover:bg-[#f3ede2] hover:text-tertiary md:inline-flex"
              to={ROUTES.OWNER_LIST_UNIT}
            >
              <Megaphone className="h-4 w-4 text-tertiary" />
              أعلن عن وحدتك
            </Link>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-5 py-2 text-white shadow-lg shadow-secondary/20 transition duration-200 hover:bg-secondary/90"
              to={ROUTES.RENTALS}
            >
              <Home className="h-4 w-4" />
              الإيجارات
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-[#e4dac5] bg-[#f2ebde] text-[#243128]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 text-right md:grid-cols-2" dir="rtl">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#1f2c22]">مجمع الخدمات للمنطقة</h3>
              <p className="text-sm leading-relaxed text-[#5f6e62]">منصة آمنة لعرض خدمات المنطقة</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#1f2c22]">روابط مهمة</h3>
              <ul className="space-y-2 text-sm text-[#5f6e62]">
                <li>
                  <a
                    href="https://www.dalilsubhi.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-emerald-700"
                  >
                    الصفحة الرئيسية
                  </a>
                </li>
                <li>
                  <a
                    href="https://chat.whatsapp.com/ECEZfbsvjlU43eDvKa9XUu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-emerald-700"
                  >
                    خدمة العملاء
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/share/g/1CzbCwjugk/?mibextid=KtfwRi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-emerald-700"
                  >
                    جروب الفيس بوك
                  </a>
                </li>
                <li>
                  <a
                    href="https://dalilsubhi.com/publishing-policy"
                    className="transition-colors hover:text-emerald-700"
                  >
                    سياسة النشر والإعلان
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="mt-8 border-t border-[#e4dac5] pt-6 text-center">
            <p className="text-xs text-[#6d756a]">© 2026 مجمع الخدمات للمنطقة</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
