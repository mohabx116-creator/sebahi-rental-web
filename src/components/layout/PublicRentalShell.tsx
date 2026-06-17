import { Home, Mail, Megaphone, Phone } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import dalilSubhiLogo from '../../assets/dalil-subhi-logo.jpg';
import { ROUTES } from '../../lib/constants/routes';

export function PublicRentalShell() {
  return (
    <div className="min-h-dvh bg-primary text-fixed font-sans">
      <header className="sticky top-0 z-40 border-b border-outline bg-primary/80 backdrop-blur-xl shadow-lg">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to={ROUTES.RENTALS}>
            <span className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-2xl bg-white shadow-lg shadow-secondary/20 border border-outline/20">
              <img src={dalilSubhiLogo} alt="دليل السبحي" className="h-full w-full object-contain mix-blend-multiply" />
            </span>
            <div className="text-right">
              <p className="text-sm font-black text-fixed sm:text-base">إيجارات المنطقة المحيطة</p>
              <p className="hidden text-xs font-medium text-fixed-dim sm:block">سوق الإيجارات في المنطقة المحيطة</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm font-bold text-fixed">
            <Link className="hidden rounded-full px-4 py-2 transition duration-200 hover:bg-white/5 hover:text-tertiary sm:inline-flex" to="/rentals/sebahi-furnished-apartment-a101">
              الإعلان المميز
            </Link>
            <Link className="hidden items-center gap-2 rounded-full px-4 py-2 transition duration-200 hover:bg-white/5 hover:text-tertiary md:inline-flex" to={ROUTES.OWNER_LIST_UNIT}>
              <Megaphone className="h-4 w-4 text-tertiary" />
              أعلن عن وحدتك
            </Link>
            <Link className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-5 py-2 text-white shadow-lg shadow-secondary/20 transition duration-200 hover:bg-secondary/90" to={ROUTES.RENTALS}>
              <Home className="h-4 w-4" />
              الإيجارات
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="bg-primary text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-right" dir="rtl">
            {/* Column 1: Brand */}
            <div className="space-y-3">
              <h3 className="font-bold text-base text-white">مجمع الخدمات للمنطقة</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                منصة آمنة لعرض خدمات المنطقة
              </p>
            </div>

            {/* Column 2: Contact/Support (Social Links) */}
            <div className="space-y-3">
              <h3 className="font-bold text-base text-white">للتواصل والدعم</h3>
              <div className="flex flex-col gap-2 mt-2">
                <a
                  href="https://chat.whatsapp.com/ECEZfbsvjlU43eDvKa9XUu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors w-fit"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  جروب الواتساب
                </a>
                <a
                  href="https://www.facebook.com/share/g/1CzbCwjugk/?mibextid=KtfwRi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors w-fit"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  جروب الفيس بوك
                </a>
              </div>
            </div>

            {/* Column 3: Important Links */}
            <div className="space-y-3">
              <h3 className="font-bold text-base text-white">روابط مهمة</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="https://www.dalilsubhi.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#059669] transition-colors"
                  >
                    الصفحة الرئيسية
                  </a>
                </li>
                <li>
                  <a
                    href="https://chat.whatsapp.com/ECEZfbsvjlU43eDvKa9XUu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#059669] transition-colors"
                  >
                    جروب الواتساب
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/share/g/1CzbCwjugk/?mibextid=KtfwRi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#059669] transition-colors"
                  >
                    جروب الفيس بوك
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact/Support (Old Rental Contact Info) */}
            <div className="space-y-3">
              <h3 className="font-bold text-base text-white">للتواصل والدعم</h3>
              <div className="flex flex-col gap-2 mt-2">
                <a
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#059669] transition-colors w-fit"
                  href="https://wa.me/201224591618"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <span dir="ltr">01224591618</span>
                </a>
                <a
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#059669] transition-colors w-fit"
                  href="mailto:dalilsubhi@gmail.com"
                >
                  <Mail className="h-4 w-4 text-emerald-400" />
                  <span dir="ltr">dalilsubhi@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 text-center">
            <p className="text-xs text-gray-500">
              © 2026 مجمع الخدمات للمنطقة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
