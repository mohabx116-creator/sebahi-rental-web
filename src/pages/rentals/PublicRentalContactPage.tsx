import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Home,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError } from '../../lib/api/api-client';
import { rentalApiService } from '../../lib/api/rental-service';
import { ROUTES } from '../../lib/constants/routes';
import {
  formatRentalMoney,
  furnishingLabels,
  getListingCoverImage,
  getListingImageAlt,
  getOptimizedListingImageUrl,
  listingStatusLabels,
  listingTypeLabels,
  publicCompoundName,
  publicRentalText,
} from './rental-format';

const contactSchema = z.object({
  tenantName: z.string().trim()
    .min(1, 'الاسم بالكامل مطلوب')
    .regex(/^[\u0621-\u064A\s]+$/, 'الاسم يجب أن يكون باللغة العربية فقط.')
    .refine((value) => {
      const words = value.split(/\s+/).filter(Boolean);
      return words.length >= 2;
    }, 'الاسم يجب أن يكون باللغة العربية ويتكون من اسمين على الأقل.'),
  tenantPhone: z.string().trim().min(5, 'اكتب رقم موبايل صحيح'),
  tenantNationalId: z.string().trim().regex(/^[0-9]{14}$/, 'الرقم القومي يجب أن يكون 14 رقمًا باللغة الإنجليزية.'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  return false;
}

function generateMessageContent({
  tenantName,
  tenantPhone,
  tenantNationalId,
  listing,
}: {
  tenantName: string;
  tenantPhone: string;
  tenantNationalId: string;
  listing: any;
}) {
  const listingUrl = `${window.location.origin}/rentals/${listing.slug}`;
  const availableBeds = listing.availableBeds ?? Math.max((listing.totalBeds ?? 4) - 0 - 0, 0);
  const totalBeds = listing.totalBeds ?? 4;
  return `طلب حجز سرير:
- الاسم بالكامل: ${tenantName}
- رقم الموبايل: ${tenantPhone}
- الرقم القومي: ${tenantNationalId}
- عنوان الإعلان: ${listing.title}
- معرف الإعلان (ID): ${listing.id}
- معرف الشقة (Unit ID): ${listing.unitId || 'غير متوفر'}
- رابط الإعلان العام: ${listingUrl}
- إيجار الشقة الشهري: ${listing.monthlyRent}
- مبلغ التأمين: ${listing.depositAmount}
- حالة الشقة: ${listing.unitCondition || 'غير متوفر'}
- السراير المتاحة: ${availableBeds}
- إجمالي السراير: ${totalBeds}`;
}

function ContactImageFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-primary p-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(214,178,94,0.35),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-tertiary backdrop-blur-md">
          <MessageCircle className="h-4 w-4 text-tertiary" />
          طلب تواصل بالواتساب
        </span>
        <div>
          <p className="text-sm font-bold text-tertiary">كمبوند السبحي</p>
          <p className="mt-2 text-2xl font-black leading-9 text-fixed">{title}</p>
        </div>
      </div>
    </div>
  );
}

export function PublicRentalContactPage() {
  const { slug } = useParams();
  const [isSubmitPending, setIsSubmitPending] = useState(false);
  const [inquiryPrepared, setInquiryPrepared] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [formValues, setFormValues] = useState<ContactFormValues | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAgain, setCopiedAgain] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const listingQuery = useQuery({
    queryKey: ['rentals', 'public', 'listing', slug],
    queryFn: () => rentalApiService.getPublicRentalListingBySlug(slug ?? ''),
    enabled: Boolean(slug),
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      tenantName: '',
      tenantPhone: '',
      tenantNationalId: '',
    },
  });

  const listing = listingQuery.data;
  const listingDetailHref = listing ? `/rentals/${listing.slug}` : ROUTES.RENTALS;
  const title = listing ? publicRentalText(listing.title) : '';
  const compoundName = publicCompoundName(listing?.compound?.name);
  const coverImage = listing ? getListingCoverImage(listing) : null;

  const onSubmit = handleSubmit(async (values) => {
    if (!listing) return;
    setSubmitError(null);
    setFormValues(values);

    const messageText = generateMessageContent({
      tenantName: values.tenantName,
      tenantPhone: values.tenantPhone,
      tenantNationalId: values.tenantNationalId,
      listing,
    });

    setGeneratedMessage(messageText);
    setInquiryPrepared(true);

    const copySuccess = await copyToClipboard(messageText);
    setCopied(copySuccess);
  });

  if (listingQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="h-[420px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
          <div className="h-[520px] animate-pulse rounded-[32px] bg-primary/30 border border-outline/25 shadow-xl" />
        </div>
      </main>
    );
  }

  if (listingQuery.isError || !listing) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center text-fixed">
        <Home className="h-14 w-14 text-tertiary" />
        <h1 className="mt-5 text-3xl font-black text-fixed">الإعلان غير موجود أو تم تحديث رابطه</h1>
        <p className="mt-3 leading-8 text-fixed-dim">
          الإعلان غير موجود أو تم تحديث رابطه. يمكنك الرجوع إلى سوق إيجارات السبحي واختيار الرابط الحالي من قائمة الإعلانات.
        </p>
        <Link className="mt-6 rounded-full bg-tertiary px-6 py-3 font-bold text-primary hover:bg-tertiary/90 transition shadow-lg shadow-tertiary/20" to={ROUTES.RENTALS}>
          العودة إلى الإيجارات
        </Link>
      </main>
    );
  }

  return (
    <main className="pb-16 text-fixed">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-bold text-fixed transition shadow-md" to={listingDetailHref}>
          <ChevronRight className="h-5 w-5 text-tertiary" />
          العودة إلى تفاصيل الإعلان
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:items-start">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-[32px] glass-panel text-right shadow-xl">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-dim">
                <ContactImageFallback title={title} />
                {coverImage && (
                  <img
                    alt={getListingImageAlt(listing, coverImage)}
                    className="relative h-full w-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={getOptimizedListingImageUrl(coverImage, 'card')}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary/30 border border-secondary/20 px-3 py-1.5 text-xs font-black text-white">
                    <Building2 className="h-4 w-4 text-tertiary" />
                    {listingStatusLabels[listing.status]}
                  </span>
                  {listing.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-tertiary px-3 py-1.5 text-xs font-black text-primary shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      مميز
                    </span>
                  )}
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-black text-fixed">{listingTypeLabels[listing.listingType]}</span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-black text-fixed">{listing.unitCondition || furnishingLabels[listing.furnishingStatus]}</span>
                </div>
                <h1 className="mt-4 text-2xl font-black leading-9 text-fixed">{title}</h1>
                <div className="mt-5">
                  <div className="rounded-3xl bg-primary/45 border border-outline/25 p-4">
                    <p className="text-xs font-bold text-fixed-dim">إيجار الشقة الشهري</p>
                    <p className="mt-1 text-xl font-black text-tertiary">{formatRentalMoney(listing.monthlyRent)}</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className="space-y-5 text-right">
            <div className="rounded-[32px] glass-panel p-5 shadow-xl sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-tertiary backdrop-blur-md">
                <MessageCircle className="h-4 w-4 text-tertiary" />
                طلب تواصل عبر الواتساب
              </span>
              <h2 className="mt-5 text-3xl font-black leading-[1.35] text-fixed">
                اطلب معاينة أو تواصل داخل {compoundName}
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['١', 'املأ البيانات كاملة'],
                  ['٢', 'تواصل عن طريق الواتساب'],
                  ['٣', 'سيتم التواصل عن طريق الرد على الخاص'],
                ].map(([step, label]) => (
                  <div className="rounded-3xl bg-primary/45 border border-outline/20 p-4" key={step}>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-black text-white">
                      {step}
                    </span>
                    <p className="mt-3 text-sm font-black leading-6 text-fixed">{label}</p>
                  </div>
                ))}
              </div>

              {inquiryPrepared ? (
                <div className="mt-7 space-y-6 text-right">
                  {inquirySuccess ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <CheckCircle2 className="h-6 w-6" />
                      </span>
                      <h3 className="mt-4 text-xl font-black text-emerald-400">تم تسجيل طلبك وحجز سرير مؤقتًا لحين مراجعة الإدارة.</h3>
                      <p className="mt-2 text-sm leading-7 text-fixed-dim">
                        سيتم التواصل معك عبر الواتساب.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <h3 className="text-xl font-black text-blue-400">تم تجهيز طلبك بنجاح.</h3>
                      {copied ? (
                        <p className="mt-2 text-sm leading-7 text-emerald-400 font-bold">
                          تم نسخ رسالة الطلب.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm leading-7 text-amber-400 font-bold">
                          لم يتم النسخ تلقائيًا.
                        </p>
                      )}
                      <p className="mt-2 text-sm leading-7 text-red-400 font-bold">
                        تنبيه: لا يتم حجز السرير إلا بعد الضغط على زر إرسال الطلب عبر الواتساب.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-fixed-dim">
                        بعد الضغط على الزر سيتم تسجيل الطلب وفتح جروب الواتساب. الصق الرسالة داخل الجروب حتى يتمكن فريق الإدارة من متابعة طلبك.
                      </p>
                    </div>
                  )}

                  <div className="rounded-[24px] border border-tertiary/30 bg-tertiary/5 p-5 space-y-4">
                    <h4 className="text-base font-black text-tertiary">الخطوات التالية الهامة:</h4>

                    <div className="grid gap-3 sm:grid-cols-3 pt-2">
                      {[
                        ['١', 'تم تجهيز بيانات الطلب'],
                        ['٢', 'تم نسخ رسالة الطلب'],
                        ['٣', 'اضغط إرسال الطلب عبر الواتساب لإكمال الحجز المؤقت'],
                      ].map(([step, label]) => (
                        <div className="rounded-2xl bg-tertiary/10 border border-tertiary/20 p-3" key={step}>
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-tertiary text-xs font-black text-primary">
                            {step}
                          </span>
                          <p className="mt-2 text-xs font-black leading-5 text-fixed">{label}</p>
                        </div>
                      ))}
                    </div>

                    {!copied && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                        <p className="text-xs text-amber-400 font-bold">
                          لم يتم النسخ تلقائيًا. انسخ الرسالة يدويًا ثم اضغط إرسال الطلب عبر الواتساب.
                        </p>
                        <textarea
                          readOnly
                          value={generatedMessage}
                          className="w-full h-32 rounded-xl border border-outline/20 bg-primary/60 p-3 text-right text-xs font-mono text-fixed focus:ring-0 focus:outline-none"
                        />
                      </div>
                    )}

                    {copied && (
                      <div className="mt-4">
                        <p className="text-xs text-fixed-dim">الرسالة المنسوخة للمراجعة:</p>
                        <textarea
                          readOnly
                          value={generatedMessage}
                          className="w-full h-32 rounded-xl border border-outline/20 bg-primary/60 p-3 text-right text-xs font-mono text-fixed focus:ring-0 focus:outline-none mt-1"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                      {submitError && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-error">
                          {submitError}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isSubmitPending}
                        onClick={async () => {
                          if (!listing || isSubmitPending || !formValues) return;
                          setSubmitError(null);
                          setIsSubmitPending(true);

                          try {
                            await rentalApiService.createRentalInquiry(listing.id, {
                              tenantName: formValues.tenantName,
                              tenantPhone: formValues.tenantPhone,
                              tenantNationalId: formValues.tenantNationalId,
                              message: generatedMessage,
                            });

                            setInquirySuccess(true);
                            window.open('https://chat.whatsapp.com/ECEZfbsvjlU43eDvKa9XUu', '_blank');
                          } catch (error) {
                            console.error(error);
                            let errorMessage = 'تعذر إرسال الطلب. حاول مرة أخرى.';
                            if (error instanceof ApiClientError) {
                              if (
                                error.status === 409 ||
                                error.status === 410 ||
                                error.message?.includes('not available') ||
                                error.message?.includes('unavailable') ||
                                error.message?.includes('متاحة')
                              ) {
                                errorMessage = 'لا توجد سراير متاحة حاليًا لهذا الإعلان.';
                              } else if (error.message) {
                                errorMessage = error.message;
                              }
                            }
                            setSubmitError(errorMessage);
                          } finally {
                            setIsSubmitPending(false);
                          }
                        }}
                        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 py-4 text-base font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {isSubmitPending ? 'جاري إرسال الطلب...' : 'إرسال طلب حجز السرير عبر الواتساب'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyToClipboard(generatedMessage);
                          if (ok) {
                            setCopiedAgain(true);
                            setTimeout(() => setCopiedAgain(false), 2000);
                          }
                        }}
                        className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 text-sm font-bold text-fixed transition cursor-pointer"
                      >
                        نسخ الرسالة مرة أخرى
                      </button>
                      {copiedAgain && (
                        <p className="text-center text-xs font-bold text-emerald-400 animate-pulse">
                          تم نسخ الرسالة.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form className="mt-7 space-y-4" onSubmit={onSubmit}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-fixed-dim">الاسم بالكامل</span>
                    <input
                      className="w-full rounded-2xl border-outline bg-primary/40 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20"
                      disabled={isSubmitPending}
                      {...register('tenantName')}
                    />
                    {errors.tenantName && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantName.message}</span>}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-fixed-dim">رقم الموبايل</span>
                    <input
                      className="w-full rounded-2xl border-outline bg-primary/40 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20"
                      disabled={isSubmitPending}
                      inputMode="tel"
                      {...register('tenantPhone')}
                    />
                    {errors.tenantPhone && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantPhone.message}</span>}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-fixed-dim">الرقم القومي</span>
                    <input
                      className="w-full rounded-2xl border-outline bg-primary/40 text-right text-fixed focus:border-tertiary focus:ring-tertiary/20"
                      disabled={isSubmitPending}
                      maxLength={14}
                      placeholder="14 رقم باللغة الإنجليزية"
                      {...register('tenantNationalId')}
                    />
                    {errors.tenantNationalId && <span className="mt-1 block text-sm font-bold text-error">{errors.tenantNationalId.message}</span>}
                  </label>

                  {submitError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-error">
                      {submitError}
                    </div>
                  )}

                  <button
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary hover:bg-tertiary/90 px-5 py-4 text-base font-black text-primary transition disabled:cursor-not-allowed disabled:opacity-60 shadow-xl shadow-tertiary/20"
                    disabled={isSubmitPending}
                    type="submit"
                  >
                    <MessageCircle className="h-5 w-5 text-primary" />
                    {isSubmitPending ? 'جاري إرسال الطلب...' : 'إنشاء طلب حجز سرير'}
                  </button>
                </form>
              )}
            </div>

            <Link
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-outline bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-black text-fixed sm:w-auto transition"
              to={listingDetailHref}
            >
              العودة للإعلان
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
