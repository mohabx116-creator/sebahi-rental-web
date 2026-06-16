import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, FileImage, Home, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ApiClientError } from '../../lib/api/api-client';
import { createCloudinaryUploadSignature, createOwnerSubmission } from '../../lib/api/rental-service';
import type { OwnerSubmissionImageInput, RentalFurnishingStatus } from '../../lib/api/types';
import { publicRentalBrand } from '../rentals/rental-format';

const BASIC_FEATURES_MAP = {
  internet: 'إنترنت',
  basic_appliances: 'أجهزة كهربائية أساسية',
  water_motor: 'موتور مياه',
  desks: 'مكاتب',
  window_mesh: 'سلك شباك',
  water_heater: 'سخان مياه',
  water_filter: 'فلتر مياه',
} as const;

type BasicFeatureKey = keyof typeof BASIC_FEATURES_MAP;
const BASIC_FEATURE_KEYS = Object.keys(BASIC_FEATURES_MAP) as BasicFeatureKey[];

const MAX_OWNER_IMAGES = 12;
const MAX_OWNER_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_OWNER_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const unitConditionOptions = [
  'سوبر لوكس',
  'مفروشة',
  'فاضية',
] as const;

const requiredNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    schema,
  );

const ownerSubmissionSchema = z.object({
  ownerName: z.string().trim().min(2, 'اكتب اسم المالك').refine(
    (value) => value.split(/\s+/).filter(Boolean).length >= 2,
    'اكتب اسم المالك',
  ),
  ownerPhone: z.string().trim().min(5, 'اكتب رقم موبايل صحيح'),
  ownerWhatsapp: z.string().trim().min(5, 'اكتب رقم موبايل صحيح'),
  ownerNationalId: z
    .string()
    .trim()
    .min(1, 'الرقم القومي للمالك مطلوب')
    .regex(/^[0-9]{14}$/, 'الرقم القومي يجب أن يكون 14 رقمًا باللغة الإنجليزية.'),
  totalBeds: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? 4 : Number(value)),
    z.number().int().min(1, 'عدد السراير يجب أن يكون 1 على الأقل').max(20, 'عدد السراير لا يمكن أن يتجاوز 20'),
  ),
  unitCondition: z.enum(unitConditionOptions),
  floor: requiredNumber(z.number({ error: 'الدور مطلوب.' }).int().min(0).max(50)),
  monthlyRent: requiredNumber(
    z.number({ error: 'الإيجار الشهري مطلوب.' }).positive('اكتب إيجارًا شهريًا صحيحًا'),
  ),
  isAirConditioned: z.boolean().default(false),
  basicFeatures: z.record(z.string(), z.boolean()).default({
    internet: true,
    basic_appliances: true,
    water_motor: true,
    desks: true,
    window_mesh: true,
    water_heater: true,
    water_filter: true,
  }),
  extraAmenitiesText: z.string().trim().optional(),
  description: z.string().trim().optional(),
  policyAccepted: z.boolean().refine((value) => value === true, 'يجب الموافقة على شروط النشر'),
});

type OwnerSubmissionFormInput = z.input<typeof ownerSubmissionSchema>;
type OwnerSubmissionFormValues = z.output<typeof ownerSubmissionSchema>;



function furnishingStatusForCondition(condition: OwnerSubmissionFormValues['unitCondition']): RentalFurnishingStatus {
  if (condition === 'سوبر لوكس') return 'FURNISHED';
  if (condition === 'مفروشة') return 'FURNISHED';
  return 'UNFURNISHED';
}

function getUploadErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 503) {
    return 'رفع الصور غير مفعل حاليًا. يرجى التواصل مع الإدارة.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'تعذر رفع الصورة. حاول مرة أخرى.';
}

function validateOwnerImageFile(file: File) {
  if (!ALLOWED_OWNER_IMAGE_TYPES.has(file.type)) {
    throw new Error('نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP فقط.');
  }

  if (file.size > MAX_OWNER_IMAGE_BYTES) {
    throw new Error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
  }
}

function buildWhatsAppMessage(values: OwnerSubmissionFormValues, submissionId: string) {
  const lines = [
    'طلب إضافة وحدة / شقة للطلاب',
    '',
    `رقم الطلب: ${submissionId}`,
    `الاسم: ${values.ownerName}`,
    `الهاتف: ${values.ownerPhone}`,
    `الواتساب: ${values.ownerWhatsapp}`,
    `الرقم القومي للمالك: ${values.ownerNationalId}`,
    `المنطقة/الكمبوند: ${publicRentalBrand.compoundAr}`,
    `نوع الوحدة: شقة`,
    `حالة الوحدة: ${values.unitCondition}`,
    `المساحة: 63 م²`,
    values.floor !== undefined ? `الدور: ${values.floor}` : null,
    `عدد الغرف: 2`,
    `إيجار الشقة الشهري: ${values.monthlyRent} ج.م`,
    `التأمين: ${values.monthlyRent * 2} ج.م`,
    values.totalBeds !== undefined ? `عدد السراير: ${values.totalBeds}` : null,
    `الشقة مكيفة: ${values.isAirConditioned ? 'نعم' : 'لا'}`,
    (() => {
      const selected = Object.keys(values.basicFeatures || {}).filter(k => values.basicFeatures[k as BasicFeatureKey]) as BasicFeatureKey[];
      if (selected.length === BASIC_FEATURE_KEYS.length) return "الأساسيات: كلها موجودة";
      if (selected.length === 0) return "الأساسيات: غير متوفرة";
      const missing = BASIC_FEATURE_KEYS.filter(k => !selected.includes(k)).map(k => BASIC_FEATURES_MAP[k]);
      return `الأساسيات: كلها موجودة عدا: ${missing.join('، ')}`;
    })(),
    values.extraAmenitiesText ? `الكماليات: ${values.extraAmenitiesText}` : null,
    values.description ? `الوصف: ${values.description}` : null,
  ].filter((line) => line !== null && line !== undefined);

  return lines.join('\n');
}

export function OwnerListUnitPage() {
  const [images, setImages] = useState<OwnerSubmissionImageInput[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [submittedData, setSubmittedData] = useState<OwnerSubmissionFormValues | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    control,
  } = useForm<OwnerSubmissionFormInput, unknown, OwnerSubmissionFormValues>({
    resolver: zodResolver(ownerSubmissionSchema),
    defaultValues: {
      unitCondition: 'سوبر لوكس',
      policyAccepted: false,
      totalBeds: 4,
      isAirConditioned: false,
      basicFeatures: {
        internet: true,
        basic_appliances: true,
        water_motor: true,
        desks: true,
        window_mesh: true,
        water_heater: true,
        water_filter: true,
      },
    },
  });

  const monthlyRentValue = useWatch({ control, name: 'monthlyRent' });
  const depositAmount = (Number(monthlyRentValue) || 0) * 2;

  const submissionMutation = useMutation({
    mutationFn: createOwnerSubmission,
    onSuccess: () => {
      reset();
      setImages([]);
      setIsSuccessModalOpen(true);
    },
  });

  async function uploadImage(file: File, sortOrder: number) {
    validateOwnerImageFile(file);
    const signature = await createCloudinaryUploadSignature();
    if (!signature.uploadUrl || !signature.fields) {
      throw new Error('إعدادات رفع الصور غير مكتملة في الخادم.');
    }

    const formData = new FormData();
    formData.append('file', file);
    Object.entries(signature.fields).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await fetch(signature.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('تعذر رفع الصورة إلى خدمة التخزين.');
    }

    const result = await response.json() as { secure_url?: string; public_id?: string; resource_type?: string };
    if (!result.secure_url) {
      throw new Error('خدمة التخزين لم ترجع رابط صورة صالحًا.');
    }
    if (result.resource_type && result.resource_type !== 'image') {
      throw new Error('خدمة التخزين لم ترجع ملف صورة صالحًا.');
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      altText: file.name,
      sortOrder,
      isCover: images.length === 0 && sortOrder === 0,
    };
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError('');
    const selectedFiles = Array.from(files);
    const remainingSlots = MAX_OWNER_IMAGES - images.length;
    if (remainingSlots <= 0 || selectedFiles.length > remainingSlots) {
      setUploadError('لا يمكن رفع أكثر من 12 صورة للوحدة.');
      return;
    }

    try {
      selectedFiles.forEach(validateOwnerImageFile);
    } catch (error) {
      setUploadError(getUploadErrorMessage(error));
      return;
    }

    setIsUploading(true);
    try {
      const nextImages: OwnerSubmissionImageInput[] = [];
      for (const file of selectedFiles) {
        nextImages.push(await uploadImage(file, images.length + nextImages.length));
      }
      setImages((current) => {
        const merged = [...current, ...nextImages].slice(0, MAX_OWNER_IMAGES);
        if (!merged.some((image) => image.isCover) && merged[0]) {
          merged[0] = { ...merged[0], isCover: true };
        }
        return merged;
      });
    } catch (error) {
      setUploadError(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      if (!next.some((image) => image.isCover) && next[0]) {
        next[0] = { ...next[0], isCover: true };
      }
      return next.map((image, sortOrder) => ({ ...image, sortOrder }));
    });
  }

  function markCover(index: number) {
    setImages((current) => current.map((image, itemIndex) => ({ ...image, isCover: itemIndex === index })));
  }

  const onSubmit = handleSubmit(async (values) => {
    setUploadError('');
    if (isUploading) {
      setUploadError('يرجى الانتظار حتى اكتمال رفع الصور قبل إرسال الطلب.');
      return;
    }
    if (images.length === 0) {
      setUploadError('يجب رفع صورة واحدة على الأقل قبل إرسال الطلب.');
      return;
    }

    setSubmittedData(values);

    await submissionMutation.mutateAsync({
      ownerName: values.ownerName,
      ownerPhone: values.ownerPhone,
      ownerWhatsapp: values.ownerWhatsapp,
      ownerNationalId: values.ownerNationalId,
      totalBeds: values.totalBeds,
      listingType: 'APARTMENT',
      furnishingStatus: furnishingStatusForCondition(values.unitCondition),
      unitCondition: values.unitCondition,
      floor: values.floor,
      bathrooms: 1,
      monthlyRent: values.monthlyRent,
      isAirConditioned: values.isAirConditioned,
      basicFeatures: Object.keys(values.basicFeatures).filter(k => values.basicFeatures[k as BasicFeatureKey]),
      extraAmenitiesText: values.extraAmenitiesText || undefined,
      description: values.description || undefined,
      images,
      policyAccepted: true,
    });
  });

  const isPending = isUploading || isSubmitting || submissionMutation.isPending;
  const success = submissionMutation.data;

  return (
    <main className="pb-16 text-fixed">
      <section className="border-b border-outline/30 bg-primary/20">
        <div className="mx-auto flex min-h-[330px] w-full max-w-7xl flex-col justify-end gap-6 px-4 py-10 text-right sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-tertiary backdrop-blur-md">
              <Home className="h-4 w-4 text-tertiary" />
              أعلن عن وحدتك
            </span>
            <h1 className="mt-5 text-3xl font-black leading-[1.35] text-fixed sm:text-5xl">
              أعلن عن وحدتك داخل {publicRentalBrand.compoundAr}
            </h1>
            <p className="mt-4 text-base leading-8 text-fixed-dim">
              أرسل بيانات وحدتك للإدارة، وسيتم مراجعتها قبل النشر. لا يتم نشر أي إعلان إلا بعد موافقة الإدارة.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {success && (
            <section className="rounded-[28px] border border-secondary/35 bg-secondary/20 p-6 text-right space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-tertiary shrink-0" />
                <h2 className="text-2xl font-black text-fixed">تم إرسال طلبك بنجاح</h2>
              </div>
              <div className="text-sm leading-7 text-fixed-dim space-y-1">
                <p>
                  رقم الطلب: <span className="font-mono font-black text-tertiary" dir="ltr">{success.id}</span>
                </p>
                <p>سيتم مراجعته من الإدارة</p>
                {success.duplicateReviewFlag && (
                  <p className="font-bold text-error mt-2">
                    قد يحتاج الطلب إلى مراجعة إضافية بسبب تكرار الرقم القومي.
                  </p>
                )}
              </div>
              {submittedData && (
                <div className="pt-2">
                  <a
                    href={`https://wa.me/201224591618?text=${encodeURIComponent(
                      buildWhatsAppMessage(submittedData, success.id)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-tertiary px-5 py-3 text-sm font-black text-primary hover:bg-tertiary/90 transition shadow-md"
                  >
                    <span>تواصل عبر الواتساب لتأكيد الطلب (01224591618)</span>
                  </a>
                </div>
              )}
            </section>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <FormSection title="بيانات المالك">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="اسم المالك" error={errors.ownerName?.message}>
                  <input {...register('ownerName')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="رقم الموبايل" error={errors.ownerPhone?.message}>
                  <input {...register('ownerPhone')} dir="ltr" disabled={isPending} className="form-input" />
                </Field>
                <Field label="رقم الواتساب" error={errors.ownerWhatsapp?.message}>
                  <input {...register('ownerWhatsapp')} dir="ltr" disabled={isPending} className="form-input" />
                </Field>
                <Field label="الرقم القومي للمالك" error={errors.ownerNationalId?.message}>
                  <input
                    {...register('ownerNationalId')}
                    placeholder="14 رقم باللغة الإنجليزية"
                    dir="ltr"
                    disabled={isPending}
                    className="form-input"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="بيانات الوحدة">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="حالة الوحدة" error={errors.unitCondition?.message}>
                  <select {...register('unitCondition')} disabled={isPending} className="form-input">
                    {unitConditionOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="الإيجار الشهري" error={errors.monthlyRent?.message}>
                  <input type="number" {...register('monthlyRent')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="التأمين = شهرين من الإيجار">
                  <input type="number" value={depositAmount} disabled className="form-input opacity-60 cursor-not-allowed bg-primary/20 text-tertiary font-bold" />
                </Field>
                <Field label="عدد السراير" error={errors.totalBeds?.message}>
                  <input type="number" {...register('totalBeds')} disabled={isPending} className="form-input" />
                  <span className="mt-1 block text-xs text-fixed-dim">عدد السراير المتاحة داخل الشقة للطلاب.</span>
                </Field>
                <Field label="الدور" error={errors.floor?.message}>
                  <input type="number" {...register('floor')} disabled={isPending} className="form-input" />
                  <span className="mt-1 block text-xs text-fixed-dim">اكتب رقم الدور فقط، مثال: 3</span>
                </Field>
              </div>

              <div className="rounded-[28px] border border-outline/30 bg-primary/30 p-5 mt-4">
                <h3 className="text-lg font-black text-fixed mb-4">بيانات ثابتة للوحدة</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="المساحة بالمتر">
                    <input value="63" disabled className="form-input opacity-60 cursor-not-allowed" />
                  </Field>
                  <Field label="عدد الغرف">
                    <input value="2" disabled className="form-input opacity-60 cursor-not-allowed" />
                  </Field>
                </div>
              </div>

              <div className="rounded-[28px] border border-outline/30 bg-primary/30 p-5 mt-4 space-y-4">
                <h3 className="text-lg font-black text-fixed">الأساسيات المتوفرة</h3>
                <p className="text-xs text-fixed-dim">كل الأساسيات محددة افتراضيًا، لو في حاجة غير متوفرة في الشقة شيل العلامة من أمامها.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {BASIC_FEATURE_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-3 text-sm font-bold text-fixed cursor-pointer">
                      <input type="checkbox" {...register(`basicFeatures.${key}`)} disabled={isPending} className="rounded border-outline bg-primary/45 text-secondary focus:ring-secondary/20 h-5 w-5" />
                      <span>{BASIC_FEATURES_MAP[key]}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 text-sm font-bold text-fixed cursor-pointer sm:col-span-2 pt-2 border-t border-outline/30 mt-2">
                    <input type="checkbox" {...register('isAirConditioned')} disabled={isPending} className="rounded border-outline bg-primary/45 text-secondary focus:ring-secondary/20 h-5 w-5" />
                    <span>الشقة مكيفة</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <Field label="الكماليات والمميزات الإضافية" error={errors.extraAmenitiesText?.message}>
                  <textarea {...register('extraAmenitiesText')} disabled={isPending} placeholder="مثال: بلكونة، قريبة من البوابة، فرش جديد، إطلالة مفتوحة..." className="form-input min-h-24 resize-y" />
                </Field>
              </div>
              <Field label="وصف إضافي اختياري" error={errors.description?.message}>
                <textarea {...register('description')} disabled={isPending} className="form-input min-h-32 resize-y" />
              </Field>
            </FormSection>

            <FormSection title="صور الوحدة">
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-outline/30 bg-primary/40 p-6 text-center transition hover:border-tertiary/40">
                {isUploading ? <Loader2 className="h-9 w-9 animate-spin text-tertiary" /> : <UploadCloud className="h-9 w-9 text-tertiary" />}
                <span className="mt-3 text-sm font-black text-fixed">رفع صور حقيقية للوحدة</span>
                <span className="mt-1 text-xs leading-6 text-fixed-dim">
                  استخدم صور JPG أو PNG أو WebP، بحد أقصى 12 صورة و5 ميجابايت للصورة.
                </span>
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={isPending}
                  onChange={(event) => void handleImageFiles(event.target.files)}
                />
              </label>

              {uploadError && (
                <p className="rounded-2xl border border-error/25 bg-error/10 p-4 text-sm font-bold leading-7 text-error">
                  {uploadError}
                </p>
              )}

              {images.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image, index) => (
                    <div key={image.url} className="overflow-hidden rounded-2xl border border-outline bg-primary/45">
                      <img alt={image.altText ?? 'صورة الوحدة'} src={image.url} className="aspect-[4/3] w-full object-cover" decoding="async" loading="lazy" />
                      <div className="flex items-center justify-between gap-2 p-3">
                        <button type="button" onClick={() => markCover(index)} className={image.isCover ? 'rounded-full border border-secondary/20 bg-secondary/35 px-3 py-1 text-xs font-black text-white' : 'rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-fixed hover:bg-white/10'}>
                          {image.isCover ? 'صورة الغلاف' : 'اختيار كغلاف'}
                        </button>
                        <button type="button" onClick={() => removeImage(index)} className="rounded-full p-2 text-error transition hover:bg-error/10" aria-label="حذف الصورة">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>

            <section className="rounded-[28px] glass-panel p-5 text-right shadow-xl">
              <label className="flex items-start gap-3 text-sm font-bold leading-7 text-fixed-dim">
                <input className="mt-1.5 rounded border-outline bg-primary/45 text-secondary focus:ring-secondary/20" type="checkbox" {...register('policyAccepted')} disabled={isPending} />
                <span>
                  أوافق على شروط نشر الإعلان، وأقر بأن نشر الإعلان لا يتم إلا بعد مراجعة وموافقة الإدارة.
                </span>
              </label>
              {errors.policyAccepted && <p className="mt-2 text-sm font-bold text-error">{errors.policyAccepted.message}</p>}
            </section>

            {submissionMutation.isError && (
              <p className="rounded-2xl border border-error/25 bg-error/10 p-4 text-sm font-bold leading-7 text-error">
                {submissionMutation.error instanceof Error ? submissionMutation.error.message : 'تعذر إرسال طلب الإعلان.'}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary px-6 py-4 text-base font-black text-primary shadow-xl shadow-tertiary/20 transition hover:bg-tertiary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <FileImage className="h-5 w-5 text-primary" />}
              {isPending ? 'جار إرسال الطلب...' : 'إرسال طلب الإعلان'}
            </button>
          </form>
        </div>
      </section>

      {isSuccessModalOpen && success && submittedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-right" dir="rtl">
          <div className="w-full max-w-lg rounded-[32px] bg-[#1a1d21] border border-white/10 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-white text-center mb-2">تم تسجيل طلبك بنجاح</h3>
            <p className="text-base leading-7 text-white/70 text-center mb-6">
              تم حفظ بيانات الشقة مبدئيًا. لإكمال إرسال الطلب ومراجعته من الإدارة، اضغط على زر واتساب وأرسل الرسالة الجاهزة.
            </p>
            
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
              <p className="text-sm font-bold leading-6 text-amber-500 text-center">
                مهم: لن يتم اعتبار الطلب مكتملًا للمراجعة إلا بعد إرسال رسالة الواتساب.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/201224591618?text=${encodeURIComponent(
                  buildWhatsAppMessage(submittedData, success.id)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsSuccessModalOpen(false)}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] px-5 py-4 text-base font-black text-white transition shadow-lg shadow-[#25D366]/20"
              >
                إرسال رسالة الواتساب الآن
              </a>
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 text-sm font-bold text-white transition"
              >
                سأرسلها لاحقًا
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-[28px] glass-panel p-5 text-right shadow-xl sm:p-6">
      <h2 className="text-2xl font-black text-fixed">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-fixed-dim">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm font-bold text-error">{error}</span>}
    </label>
  );
}
