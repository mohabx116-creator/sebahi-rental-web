import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Home,
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

const legacyPaymentStatuses: ReservationStatus[] = ['PENDING_PAYMENT', 'PAYMENT_LOCKED'];
const positiveStatuses: ReservationStatus[] = ['RESERVED', 'PAID_PENDING_CONFIRMATION', 'CONFIRMED'];
const negativeStatuses: ReservationStatus[] = ['CANCELLED', 'EXPIRED', 'REJECTED', 'REFUNDED'];

function StatusIcon({ status }: { status: ReservationStatus }) {
  if (positiveStatuses.includes(status)) {
    return <CheckCircle2 className="h-12 w-12 text-tertiary" />;
  }
  if (negativeStatuses.includes(status)) {
    return <XCircle className="h-12 w-12 text-error" />;
  }
  return <Clock className="h-12 w-12 text-tertiary" />;
}

function statusTone(status: ReservationStatus) {
  if (positiveStatuses.includes(status)) return 'border-secondary/40 bg-secondary/30 text-white';
  if (negativeStatuses.includes(status)) return 'border-error/25 bg-error/15 text-error';
  return 'border-tertiary/25 bg-tertiary/15 text-tertiary';
}

function statusDescription(status: ReservationStatus) {
  if (status === 'CONFIRMED') {
    return 'تم تأكيد الحجز من خلال الخادم. يمكن متابعة الخطوات الرسمية التالية مع إدارة المنصة.';
  }
  if (status === 'RESERVED') {
    return 'تم تسجيل الحجز المؤقت من الخادم، وسيتم التعامل معه كحجز سرير خلال مدة المراجعة.';
  }
  if (status === 'PAID_PENDING_CONFIRMATION') {
    return 'هذا طلب قديم مرتبط بدفع إلكتروني وينتظر التأكيد النهائي من الخادم أو الإدارة.';
  }
  if (status === 'PAYMENT_LOCKED' || status === 'PENDING_PAYMENT') {
    return 'هذا طلب قديم مرتبط بمسار دفع إلكتروني ولم يكتمل تأكيده من الخادم بعد.';
  }
  if (status === 'CANCELLED') {
    return 'تم إلغاء هذا الطلب، ولا يوجد سرير محجوز بناء عليه.';
  }
  if (status === 'EXPIRED') {
    return 'انتهت مهلة الطلب ولم يعد الحجز فعالا.';
  }
  if (status === 'REFUNDED') {
    return 'تم تسجيل حالة رد المبلغ لهذا الطلب داخل النظام.';
  }
  if (status === 'REJECTED') {
    return 'تم رفض هذا الطلب، ويمكن اختيار سرير آخر من سوق الإيجارات.';
  }
  return 'تابع حالة الطلب من هذه الصفحة، ولا تعتمد على أي تأكيد خارج الخادم.';
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
          <div className="h-[420px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
          <div className="h-[320px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
        </div>
      </main>
    );
  }

  if (reservationQuery.isError || !reservationQuery.data) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center text-fixed">
        <CalendarClock className="h-14 w-14 text-tertiary" />
        <h1 className="mt-5 text-3xl font-black text-fixed">طلب الحجز غير موجود</h1>
        <p className="mt-3 leading-8 text-fixed-dim">
          قد يكون رقم الطلب غير صحيح أو لم يعد متاحا للعرض. ارجع إلى سوق إيجارات السبحي لاختيار سرير مناسب.
        </p>
        <Link className="mt-6 rounded-full bg-tertiary px-6 py-3 font-bold text-primary hover:bg-tertiary/90 transition shadow-lg shadow-tertiary/20" to={ROUTES.RENTALS}>
          العودة إلى الإيجارات
        </Link>
      </main>
    );
  }

  const reservation = reservationQuery.data;
  const listingTitle = reservation.listing ? publicRentalText(reservation.listing.title) : null;
  const listingHref = reservation.listing ? `/rentals/${reservation.listing.slug}` : null;
  const isLegacyPaymentRecord = legacyPaymentStatuses.includes(reservation.status);

  return (
    <main className="pb-16 text-fixed">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-bold text-fixed transition shadow-md" to={ROUTES.RENTALS}>
          <Home className="h-4 w-4 text-tertiary" />
          العودة إلى الإيجارات
        </Link>

        <section className="mt-5 overflow-hidden rounded-[32px] glass-panel text-right shadow-xl">
          <div className="bg-primary p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-tertiary">{publicRentalBrand.rentalsTitle}</p>
                <h1 className="mt-2 text-3xl font-black leading-[1.35] sm:text-4xl text-fixed">حالة الحجز المؤقت</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-fixed-dim/95">
                  هذه الصفحة تعرض الحالة القادمة من الخادم فقط. لا توجد حالة نجاح محلية أو تأكيد خارج مراجعة الإدارة.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-3 rounded-3xl bg-white/5 border border-white/10 p-4">
                <StatusIcon status={reservation.status} />
                <div>
                  <p className="text-xs font-bold text-fixed-dim">رقم الطلب</p>
                  <p className="font-mono text-lg font-black tracking-wide text-white">#{shortId(reservation.id)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="space-y-5">
              <section className={`rounded-[28px] border p-5 ${statusTone(reservation.status)}`}>
                <p className="text-sm font-black opacity-80">الحالة الحالية</p>
                <h2 className="mt-2 text-3xl font-black text-fixed">
                  {reservationStatusLabels[reservation.status] ?? reservation.status}
                </h2>
                <p className="mt-3 text-sm leading-7 text-fixed-dim">{statusDescription(reservation.status)}</p>
              </section>

              {isLegacyPaymentRecord && (
                <section className="rounded-[28px] border border-tertiary/30 bg-tertiary/20 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-tertiary">طلب قديم قيد المراجعة</p>
                      <h3 className="mt-3 text-2xl font-black text-fixed">
                        لا يوجد دفع إلكتروني جديد لحجوزات السراير
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-fixed-dim">
                        يتم عرض هذه الحالة للطلبات القديمة فقط. المسار الحالي لحجز السرير لا ينشئ دفعا إلكترونيا جديدا.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {reservation.listing && (
                <section className="rounded-[28px] bg-primary/45 border border-outline/25 p-5 shadow-md">
                  <p className="text-sm font-bold text-tertiary">الإعلان المرتبط</p>
                  <h2 className="mt-2 text-2xl font-black leading-9 text-fixed">{listingTitle}</h2>
                  <p className="mt-2 text-sm text-fixed-dim">
                    حالة الإعلان: {listingStatusLabels[reservation.listing.status] ?? reservation.listing.status}
                  </p>
                  {listingHref && (
                    <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-tertiary hover:bg-tertiary/90 px-5 py-2.5 text-sm font-bold text-primary transition shadow-lg shadow-tertiary/20" to={listingHref}>
                      عرض الإعلان
                      <ArrowLeft className="h-4 w-4 text-primary" />
                    </Link>
                  )}
                </section>
              )}
            </div>

            <aside className="space-y-4 rounded-[28px] bg-primary/40 border border-outline/20 p-5 lg:sticky lg:top-24">
              <div>
                <p className="text-sm font-bold text-fixed-dim">القيمة المسجلة للطلب</p>
                <p className="mt-1 text-3xl font-black text-tertiary">{formatRentalMoney(reservation.amount)}</p>
              </div>
              <div className="h-px bg-outline/20" />
              <div className="grid gap-3">
                <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs font-bold text-fixed-dim">رقم الطلب الكامل</p>
                  <p className="mt-1 break-all font-mono text-sm font-black text-fixed">{reservation.id}</p>
                </div>
                <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs font-bold text-fixed-dim">تاريخ الطلب</p>
                  <p className="mt-1 font-black text-fixed">{formatRentalDate(reservation.createdAt)}</p>
                </div>
                <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs font-bold text-fixed-dim">انتهاء مهلة الحجز</p>
                  <p className="mt-1 font-black text-fixed">{formatRentalDate(reservation.reservedUntil)}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-secondary/20 border border-secondary/30 p-4 text-sm leading-7 text-fixed-dim">
                <ShieldCheck className="mb-2 h-5 w-5 text-tertiary" />
                حجز السرير يعالج من خلال الخادم فقط. الواجهة لا تصنع تأكيدا وهميا ولا تغير حالة الطلب محليا.
              </div>
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline/20 bg-primary/50 p-5 sm:flex-row sm:justify-between">
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-outline bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-bold text-fixed transition" to={ROUTES.RENTALS}>
              <Home className="h-4 w-4 text-tertiary" />
              العودة إلى سوق الإيجارات
            </Link>
            {listingHref && (
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-tertiary hover:bg-tertiary/90 px-5 py-3 text-sm font-bold text-primary transition shadow-lg shadow-tertiary/20" to={listingHref}>
                عرض تفاصيل الإعلان
                <ArrowLeft className="h-4 w-4 text-primary" />
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
