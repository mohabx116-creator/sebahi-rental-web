import { Building2, Home, LockKeyhole, MessageCircle } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '../../lib/constants/routes';
import { publicRentalBrand } from '../../pages/rentals/rental-format';

export function PublicRentalShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to={ROUTES.RENTALS}>
            <span className="brand-mark">س</span>
            <span>
              <span style={{ display: 'block' }}>{publicRentalBrand.marketplaceLabel}</span>
              <small className="muted">{publicRentalBrand.compoundEn}</small>
            </span>
          </Link>
          <nav className="nav" aria-label="روابط بوابة الإيجارات">
            <Link to={ROUTES.RENTALS}>
              <Home size={18} />
              الوحدات
            </Link>
            <Link to="/rentals/sebahi-furnished-apartment-a101">
              <Building2 size={18} />
              الإعلان المميز
            </Link>
            <Link to="/rentals/sebahi-furnished-apartment-a101/contact">
              <LockKeyhole size={18} />
              التواصل
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="footer">
        <div className="footer-inner">
          <p>
            <MessageCircle size={16} style={{ verticalAlign: 'middle' }} /> بوابة عامة لطلبات الإيجار والمعاينة داخل كمباوند السبحي. بيانات المالك لا تظهر إلا إذا أكد الخادم فتح التواصل.
          </p>
        </div>
      </footer>
    </div>
  );
}
