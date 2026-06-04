import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Hourglass,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { rentalApiService } from '../../lib/api/rental-service';
import type { RentalReservation } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import {
  formatRentalDate,
  formatRentalMoney,
  listingStatusLabels,
  publicRentalBrand,
  publicRentalText,
  reservationStatusLabels,
  shortId,
} from './rental-format';

type ReservationStatus = RentalReservation['status'];

const paymentPendingStatuses: ReservationStatus[] = ['PENDING_PAYMENT', 'PAYMENT_LOCKED'];
const positiveStatuses: ReservationStatus[] = ['RESERVED', 'PAID_PENDING_CONFIRMATION', 'CONFIRMED'];
const negativeStatuses: ReservationStatus[] = ['CANCELLED', 'EXPIRED', 'REJECTED', 'REFUNDED'];

function StatusIcon({ status }: { status: ReservationStatus }) {
  if (positiveStatuses.includes(status)) {
    return <CheckCircle2 className="h-12 w-12 text-secondary" />;
  }
  if (negativeStatuses.includes(status)) {
    return <XCircle className="h-12 w-12 text-error" />;
  }
  return <Clock className="h-12 w-12 text-tertiary" />;
}

function statusTone(status: ReservationStatus) {
  if (positiveStatuses.includes(status)) return 'border-secondary/30 bg-secondary/10 text-secondary';
  if (negativeStatuses.includes(status)) return 'border-error/25 bg-error/10 text-error';
  return 'border-tertiary/25 bg-tertiary/10 text-tertiary';
}

function statusDescription(status: ReservationStatus) {
  if (status === 'CONFIRMED') {
    return 'تم تأكيد الحجز من خلال الخادم. يمكن متابعة الخطوات الرسمية التالية مع إدارة المنصة.';
  }
  if (status === 'RESERVED') {
    return 'تم تثبيت الحجز المؤقت بعد تأكيد الدفع من الخادم، والوحدة غير متاحة لحجز آخر خلال مدة الحجز.';
  }
  if (status === 'PAID_PENDING_CONFIRMATION') {
    return 'تم تسجيل الدفع وينتظر الحجز التأكيد النهائي من الخادم أو الإدارة.';
  }
  if (status === 'PAYMENT_LOCKED' || status === 'PENDING_PAYMENT') {
    return 'بدأ طلب الحجز، لكن الدفع لم يكتمل أو لم يؤكد من الخادم بعد.';
  }
  if (status === 'CANCELLED') {
    return 'تم إلغاء هذا الطلب، ولا توجد وحدة محجوزة بناء عليه.';
  }
  if (status === 'EXPIRED') {
    return 'انتهت مهلة الطلب ولم يعد الحجز فعالا.';
  }
  if (status === 'REFUNDED') {
    return 'تم تسجيل حالة رد المبلغ لهذا الطلب داخل النظام.';
  }
  if (status === 'REJECTED') {
    return 'تم رفض هذا الطلب، ويمكن اختيار وحدة أخرى من سوق الإيجارات.';
  }
  return 'تابع حالة الطلب من هذه الصفحة، ولا تعتمد على أي تأكيد خارج الخادم.';
}

function getPotentialPaymentUrl(reservation: RentalReservation) {
  const extendedReservation = reservation as RentalReservation & {
    paymentUrl?: string | null;
    payment?: { paymentUrl?: string | null } | null;
  };

  return extendedReservation.paymentUrl ?? extendedReservation.payment?.paymentUrl ?? null;
}

export function PublicRentalReservationPage() {
  const { id } = useParams();
  const reservationQuery = useQuery({
    queryKey: ['rentals', 'public', 'reservation', id],
    queryFn: () => rentalApiService.getRentalReservation(id ?? ''),
    enabled: Boolean(id),
  });

  if (reservationQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[420px] animate-pulse rounded-[32px] bg-white shadow-xl shadow-primary/5" />
          <div className="h-[320px] animate-pulse rounded-[32px] bg-white shadow-xl shadow-primary/5" />
        </div>
      </main>
    );
  }

  if (reservationQuery.isError || !reservationQuery.data) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
        <CalendarClock className="h-14 w-14 text-secondary" />
        <h1 className="mt-5 text-3xl font-black text-primary">طلب الحجز غير موجود</h1>
        <p className="mt-3 leading-8 text-on-surface-variant">
          قد يكون رقم الطلب غير صحيح أو لم يعد متاحا للعرض. ارجع إلى سوق إيجارات السبحي لاختيار وحدة مناسبة.
        </p>
        <Link className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white" to={ROUTES.RENTALS}>
          العودة إلى الإيجارات
        </Link>
      </main>
    );
  }

  const reservation = reservationQuery.data;
  const listingTitle = reservation.listing ? publicRentalText(reservation.listing.title) : null;
  const listingHref = reservation.listing ? `/rentals/${reservation.listing.slug}` : null;
  const paymentUrl = getPotentialPaymentUrl(reservation);
  const isPaymentPending = paymentPendingStatuses.includes(reservation.status);

  return (
    <main className="bg-background pb-16">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm shadow-primary/5" to={ROUTES.RENTALS}>
          <Home className="h-4 w-4" />
          العودة إلى الإيجارات
        </Link>

        <section className="mt-5 overflow-hidden rounded-[32px] border border-outline-variant/60 bg-white text-right shadow-2xl shadow-primary/10">
          <div className="bg-primary p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-secondary-fixed">{publicRentalBrand.rentalsTitle}</p>
                <h1 className="mt-2 text-3xl font-black leading-[1.35] sm:text-4xl">حالة الحجز المؤقت</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                  هذه الصفحة تعرض الحالة القادمة من الخادم فقط. لا توجد حالة نجاح محلية أو تأكيد خارج مسار الدفع الرسمي.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-3 rounded-3xl bg-white/10 p-4">
                <StatusIcon status={reservation.status} />
                <div>
                  <p className="text-xs font-bold text-white/70">رقم الطلب</p>
                  <p className="font-mono text-lg font-black tracking-wide text-white">#{shortId(reservation.id)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="space-y-5">
              <section className={`rounded-[28px] border p-5 ${statusTone(reservation.status)}`}>
                <p className="text-sm font-black opacity-80">الحالة الحالية</p>
                <h2 className="mt-2 text-3xl font-black text-primary">
                  {reservationStatusLabels[reservation.status] ?? reservation.status}
                </h2>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{statusDescription(reservation.status)}</p>
              </section>

              {isPaymentPending && (
                <section className="rounded-[28px] border border-tertiary/25 bg-tertiary/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-black text-tertiary">
                        <CreditCard className="h-4 w-4" />
                        الدفع الإلكتروني قيد التجهيز
                      </p>
                      <h3 className="mt-3 text-2xl font-black text-primary">
                        {paymentUrl ? 'رابط الدفع متاح لهذا الطلب' : 'لا يوجد رابط دفع متاح حاليا'}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                        لن يتم اعتبار الحجز ناجحا إلا بعد تأكيد الدفع من الخادم. إذا لم يظهر رابط دفع، فهذا يعني أن مزود الدفع لم يجهز بعد.
                      </p>
                    </div>
                    <Hourglass className="h-10 w-10 text-tertiary" />
                  </div>
                  {paymentUrl && (
                    <a
                      className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-black text-white sm:w-auto"
                      href={paymentUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      إتمام الدفع
                      <ArrowLeft className="h-4 w-4" />
                    </a>
                  )}
                </section>
              )}

              {reservation.listing && (
                <section className="rounded-[28px] border border-outline-variant/60 bg-white p-5 shadow-sm shadow-primary/5">
                  <p className="text-sm font-bold text-secondary">الوحدة المرتبطة</p>
                  <h2 className="mt-2 text-2xl font-black leading-9 text-primary">{listingTitle}</h2>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    حالة الوحدة: {listingStatusLabels[reservation.listing.status] ?? reservation.listing.status}
                  </p>
                  {listingHref && (
                    <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white" to={listingHref}>
                      عرض الوحدة
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  )}
                </section>
              )}
            </div>

            <aside className="space-y-4 rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-5 lg:sticky lg:top-24">
              <div>
                <p className="text-sm font-bold text-on-surface-variant">قيمة رسوم الحجز</p>
                <p className="mt-1 text-3xl font-black text-primary">{formatRentalMoney(reservation.amount)}</p>
              </div>
              <div className="h-px bg-outline-variant/60" />
              <div className="grid gap-3">
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-bold text-on-surface-variant">رقم الطلب الكامل</p>
                  <p className="mt-1 break-all font-mono text-sm font-black text-primary">{reservation.id}</p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-bold text-on-surface-variant">تاريخ الطلب</p>
                  <p className="mt-1 font-black text-primary">{formatRentalDate(reservation.createdAt)}</p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-xs font-bold text-on-surface-variant">انتهاء مهلة الحجز</p>
                  <p className="mt-1 font-black text-primary">{formatRentalDate(reservation.reservedUntil)}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-secondary/10 p-4 text-sm leading-7 text-secondary">
                <ShieldCheck className="mb-2 h-5 w-5" />
                الحجز والدفع يعالجان من خلال الخادم فقط. الواجهة لا تصنع تأكيدا وهميا ولا تغير حالة الطلب محليا.
              </div>
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant/60 bg-surface-container-low p-5 sm:flex-row sm:justify-between">
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-primary" to={ROUTES.RENTALS}>
              <Home className="h-4 w-4" />
              العودة إلى سوق الإيجارات
            </Link>
            {listingHref && (
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white" to={listingHref}>
                عرض تفاصيل الوحدة
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
