import { Building2, FileText, Home, Mail, Megaphone, Phone, ShieldCheck } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '../../lib/constants/routes';

export function PublicRentalShell() {
  return (
    <div className="min-h-dvh bg-primary text-fixed font-sans">
      <header className="sticky top-0 z-40 border-b border-outline bg-primary/80 backdrop-blur-xl shadow-lg">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to={ROUTES.RENTALS}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="text-right">
              <p className="text-sm font-black text-fixed sm:text-base">إيجارات كمبوند السبحي</p>
              <p className="hidden text-xs font-medium text-fixed-dim sm:block">سوق الإيجارات داخل كمبوند السبحي</p>
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

      <footer className="border-t border-outline bg-surface-dim/40 text-fixed-dim">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 text-right text-sm sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:items-start lg:px-8">
          <div className="space-y-3">
            <p className="text-base font-extrabold text-tertiary">سوق إيجارات السبحي</p>
            <p className="mt-1 leading-7 text-fixed-dim/90">منصة عرض وحدات الإيجار داخل كمبوند السبحي مع تحقق دفع آمن عبر الخادم.</p>
            <div className="flex items-center gap-2 font-bold text-secondary-container">
              <ShieldCheck className="h-5 w-5 text-tertiary" />
              لا يتم عرض بيانات المالك إلا بعد تحقق الدفع من الخادم
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-base font-extrabold text-tertiary">للتواصل والدعم</p>
            <a className="flex items-center gap-2 font-semibold hover:text-tertiary transition" href="tel:+201027613133">
              <Phone className="h-4 w-4 text-tertiary" />
              <span dir="ltr">+201027613133</span>
            </a>
            <a className="flex items-center gap-2 font-semibold hover:text-tertiary transition" href="mailto:mohabx116@gmail.com">
              <Mail className="h-4 w-4 text-tertiary" />
              <span dir="ltr">mohabx116@gmail.com</span>
            </a>
          </div>
          <div className="space-y-3">
            <p className="text-base font-extrabold text-tertiary">روابط مهمة</p>
            <Link className="flex items-center gap-2 font-semibold hover:text-tertiary transition" to={ROUTES.OWNER_LIST_UNIT}>
              <Megaphone className="h-4 w-4 text-tertiary" />
              أعلن عن وحدتك
            </Link>
            <Link className="flex items-center gap-2 font-semibold hover:text-tertiary transition" to={ROUTES.REFUND_POLICY}>
              <FileText className="h-4 w-4 text-tertiary" />
              سياسة الاسترجاع
            </Link>
            <span className="block text-xs leading-6 text-fixed-dim/70">سياسة الخصوصية والشروط قيد الإعداد قبل تفعيل المدفوعات.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
