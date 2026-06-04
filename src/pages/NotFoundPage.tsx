import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../lib/constants/routes';

export function NotFoundPage() {
  return (
    <main className="center-state page">
      <section className="panel">
        <SearchX size={48} color="#b58a35" />
        <h1 className="title">الصفحة غير موجودة</h1>
        <p className="muted">الرابط الذي تحاول فتحه غير متاح داخل بوابة إيجارات السبحي.</p>
        <div className="actions" style={{ justifyContent: 'center', marginTop: 18 }}>
          <Link className="btn" to={ROUTES.RENTALS}>العودة إلى الإيجارات</Link>
        </div>
      </section>
    </main>
  );
}
