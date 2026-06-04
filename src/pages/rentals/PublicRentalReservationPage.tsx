import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Clock, CreditCard, Home, ShieldCheck, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import type { RentalReservation } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import { formatRentalDate, formatRentalMoney, publicRentalBrand, publicRentalText, reservationStatusLabels, shortId } from './rental-format';

type ReservationStatus = RentalReservation['status'];

const paymentPendingStatuses: ReservationStatus[] = ['PENDING_PAYMENT', 'PAYMENT_LOCKED'];
const positiveStatuses: ReservationStatus[] = ['RESERVED', 'PAID_PENDING_CONFIRMATION', 'CONFIRMED'];
const negativeStatuses: ReservationStatus[] = ['CANCELLED', 'EXPIRED', 'REJECTED', 'REFUNDED'];

function StatusIcon({ status }: { status: ReservationStatus }) {
  if (positiveStatuses.includes(status)) return <CheckCircle2 size={48} color="#b58a35" />;
  if (negativeStatuses.includes(status)) return <XCircle size={48} color="#a53b32" />;
  return <Clock size={48} color="#143d35" />;
}

function statusDescription(status: ReservationStatus) {
  if (status === 'CONFIRMED') return 'تم تأكيد الحجز من خلال الخادم. يمكن متابعة الخطوات الرسمية التالية مع إدارة المنصة.';
  if (status === 'RESERVED') return 'تم تثبيت الحجز المؤقت بعد تأكيد الدفع من الخادم.';
  if (status === 'PAID_PENDING_CONFIRMATION') return 'تم تسجيل الدفع وينتظر الحجز التأكيد النهائي من الخادم أو الإدارة.';
  if (status === 'PAYMENT_LOCKED' || status === 'PENDING_PAYMENT') return 'بدأ طلب الحجز، لكن الدفع لم يكتمل أو لم يؤكد من الخادم بعد.';
  if (status === 'CANCELLED') return 'تم إلغاء هذا الطلب، ولا توجد وحدة محجوزة بناء عليه.';
  if (status === 'EXPIRED') return 'انتهت مهلة الطلب ولم يعد الحجز فعالا.';
  if (status === 'REFUNDED') return 'تم تسجيل حالة رد المبلغ لهذا الطلب داخل النظام.';
  if (status === 'REJECTED') return 'تم رفض هذا الطلب، ويمكن اختيار وحدة أخرى من سوق الإيجارات.';
  return 'تابع حالة الطلب من هذه الصفحة، ولا تعتمد على أي تأكيد خارج الخادم.';
}

export function PublicRentalReservationPage() {
  const { id } = useParams();
  const reservationQuery = useQuery({
    queryKey: ['rentals', 'public', 'reservation', id],
    queryFn: () => rentalApiService.getRentalReservation(id ?? ''),
    enabled: Boolean(id),
  });

  if (reservationQuery.isLoading) return <main className="page"><div className="panel">جاري تحميل حالة الحجز...</div></main>;
  if (reservationQuery.isError || !reservationQuery.data) {
    return (
      <main className="center-state page">
        <section className="panel">
          <CalendarClock size={52} color="#b58a35" />
          <h1 className="title">طلب الحجز غير موجود</h1>
          <p className="muted">قد يكون رقم الطلب غير صحيح أو لم يعد متاحا للعرض.</p>
          <Link className="btn" to={ROUTES.RENTALS}>العودة إلى الإيجارات</Link>
        </section>
      </main>
    );
  }

  const reservation = reservationQuery.data;
  const listingTitle = reservation.listing ? publicRentalText(reservation.listing.title) : null;
  const listingHref = reservation.listing ? `/rentals/${reservation.listing.slug}` : null;
  const paymentUrl = reservation.paymentUrl ?? reservation.payment?.paymentUrl ?? null;
  const isPaymentPending = paymentPendingStatuses.includes(reservation.status);

  return (
    <main className="page">
      <Link className="btn-light" to={ROUTES.RENTALS}><Home size={17} /> العودة إلى الإيجارات</Link>
      <section className="panel" style={{ marginTop: 20 }}>
        <div className="status-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#805b16', fontWeight: 900 }}>{publicRentalBrand.rentalsTitle}</p>
            <h1 className="title">حالة الحجز المؤقت</h1>
            <p className="muted">هذه الصفحة تعرض الحالة القادمة من الخادم فقط. لا توجد حالة نجاح محلية أو تأكيد خارج مسار الدفع الرسمي.</p>
          </div>
          <div className="soft-box">
            <StatusIcon status={reservation.status} />
            <small>رقم الطلب</small>
            <strong dir="ltr">#{shortId(reservation.id)}</strong>
          </div>
        </div>
        <div className="grid detail-grid" style={{ marginTop: 20 }}>
          <div className="grid">
            <section className="notice">
              <strong>{reservationStatusLabels[reservation.status] ?? reservation.status}</strong>
              <p>{statusDescription(reservation.status)}</p>
            </section>
            {isPaymentPending && (
              <section className="notice">
                <CreditCard size={20} />
                <strong>{paymentUrl ? 'رابط الدفع متاح لهذا الطلب' : 'لا يوجد رابط دفع متاح حاليا'}</strong>
                <p>لن يتم اعتبار الحجز ناجحا إلا بعد تأكيد الدفع من الخادم.</p>
                {paymentUrl && <a className="btn-secondary" href={paymentUrl} rel="noreferrer" target="_blank">إتمام الدفع</a>}
              </section>
            )}
            {reservation.listing && (
              <section className="soft-box">
                <small>الوحدة المرتبطة</small>
                <h2 className="section-title">{listingTitle}</h2>
                {listingHref && <Link className="btn" to={listingHref}>عرض الوحدة</Link>}
              </section>
            )}
          </div>
          <aside className="grid">
            <div className="soft-box"><small>رسوم الحجز</small><strong>{formatRentalMoney(reservation.amount)}</strong></div>
            <div className="soft-box"><small>رقم الطلب الكامل</small><strong dir="ltr">{reservation.id}</strong></div>
            <div className="soft-box"><small>تاريخ الطلب</small><strong>{formatRentalDate(reservation.createdAt)}</strong></div>
            <div className="soft-box"><small>انتهاء المهلة</small><strong>{formatRentalDate(reservation.reservedUntil)}</strong></div>
            <div className="notice"><ShieldCheck size={18} /> الحجز والدفع يعالجان من خلال الخادم فقط.</div>
          </aside>
        </div>
      </section>
    </main>
  );
}
