import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, FileImage, Home, Loader2, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError } from '../../lib/api/api-client';
import { createCloudinaryUploadSignature, createOwnerSubmission } from '../../lib/api/rental-service';
import type { OwnerSubmissionImageInput, RentalFurnishingStatus } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import { publicRentalBrand } from '../rentals/rental-format';

const MAX_OWNER_IMAGES = 12;
const MAX_OWNER_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_OWNER_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const unitConditionOptions = [
  'سوبر لوكس',
  'مفروشة',
  'فاضية',
] as const;

const requiredPositiveNumber = (message: string) => z.coerce.number().positive(message);
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
  ownerNationalId: z.string().trim().optional(),
  unitCondition: z.enum(unitConditionOptions),
  floor: z.preprocess(optionalNumber, z.number().int().optional()),
  areaSqm: requiredPositiveNumber('اكتب مساحة صحيحة'),
  bedrooms: z.coerce.number().int().min(0),
  monthlyRent: requiredNumber(
    z.number({ error: 'الإيجار الشهري مطلوب.' }).positive('اكتب إيجارًا شهريًا صحيحًا'),
  ),
  depositAmount: requiredNumber(
    z.number({ error: 'مبلغ التأمين مطلوب.' }).nonnegative('اكتب مبلغ تأمين صحيحًا'),
  ),
  basics: z.string().trim().optional(),
  amenities: z.string().trim().optional(),
  description: z.string().trim().optional(),
  policyAccepted: z.boolean().refine((value) => value === true, 'يجب الموافقة على سياسة الاسترجاع وشروط النشر'),
});

type OwnerSubmissionFormInput = z.input<typeof ownerSubmissionSchema>;
type OwnerSubmissionFormValues = z.output<typeof ownerSubmissionSchema>;

function optionalNumber(value: unknown) {
  return value === '' || value === null || value === undefined ? undefined : Number(value);
}

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

export function OwnerListUnitPage() {
  const [images, setImages] = useState<OwnerSubmissionImageInput[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<OwnerSubmissionFormInput, unknown, OwnerSubmissionFormValues>({
    resolver: zodResolver(ownerSubmissionSchema),
    defaultValues: {
      unitCondition: 'سوبر لوكس',
      policyAccepted: false,
    },
  });

  const submissionMutation = useMutation({
    mutationFn: createOwnerSubmission,
    onSuccess: () => {
      reset();
      setImages([]);
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

    await submissionMutation.mutateAsync({
      ownerName: values.ownerName,
      ownerPhone: values.ownerPhone,
      ownerWhatsapp: values.ownerWhatsapp,
      ownerNationalId: values.ownerNationalId || undefined,
      listingType: 'APARTMENT',
      furnishingStatus: furnishingStatusForCondition(values.unitCondition),
      unitCondition: values.unitCondition,
      floor: values.floor,
      areaSqm: values.areaSqm,
      bedrooms: values.bedrooms,
      bathrooms: 1,
      monthlyRent: values.monthlyRent,
      depositAmount: values.depositAmount,
      basics: values.basics || undefined,
      amenities: values.amenities || undefined,
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
        <div className="mx-auto grid min-h-[330px] w-full max-w-7xl items-end gap-6 px-4 py-10 text-right sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-tertiary backdrop-blur-md">
              <Home className="h-4 w-4 text-tertiary" />
              أعلن عن وحدتك
            </span>
            <h1 className="mt-5 text-3xl font-black leading-[1.35] text-fixed sm:text-5xl">
              أعلن عن وحدتك داخل {publicRentalBrand.compoundAr}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-fixed-dim">
              أرسل بيانات وحدتك للإدارة، وسيتم مراجعتها قبل النشر. لا يتم نشر أي إعلان إلا بعد موافقة الإدارة.
            </p>
          </div>
          <div className="rounded-[28px] border border-secondary/35 bg-secondary/20 p-5">
            <ShieldCheck className="h-8 w-8 text-tertiary" />
            <p className="mt-3 text-lg font-black text-fixed">الدفع الإلكتروني قيد التجهيز</p>
            <p className="mt-2 text-sm leading-7 text-fixed-dim">
              رسوم نشر الإعلان لا يتم تحصيلها داخل المنصة حاليًا، وسيتم تفعيلها بعد اعتماد بوابة الدفع.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] glass-panel p-5 text-right shadow-xl">
            <h2 className="text-xl font-black text-fixed">خطوات النشر</h2>
            <ol className="mt-5 space-y-3 text-sm leading-7 text-fixed-dim">
              {[
                'أرسل بيانات الوحدة',
                'الإدارة تراجع الطلب',
                'يتم التواصل معك لاستكمال النشر والدفع عند تفعيل الخدمة',
                'يتم نشر الإعلان بعد الموافقة',
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[28px] glass-panel p-5 text-sm leading-7 text-fixed-dim shadow-xl">
            <p className="font-black text-fixed">سياسة الاسترجاع</p>
            <p className="mt-2">رسوم نشر الإعلان، عند تفعيل الدفع الإلكتروني، لا تكون مستردة بعد نشر الإعلان.</p>
            <Link className="mt-3 inline-flex font-black text-tertiary hover:underline" to={ROUTES.REFUND_POLICY}>
              قراءة السياسة كاملة
            </Link>
          </div>
        </aside>

        <div className="space-y-6">
          {success && (
            <section className="rounded-[28px] border border-secondary/35 bg-secondary/20 p-6 text-right">
              <CheckCircle2 className="h-10 w-10 text-tertiary" />
              <h2 className="mt-4 text-2xl font-black text-fixed">تم إرسال طلب إعلان وحدتك بنجاح.</h2>
              <p className="mt-2 text-sm leading-7 text-fixed-dim">
                رقم الطلب: <span className="font-mono font-black text-tertiary" dir="ltr">{success.id}</span>
              </p>
              <p className="mt-2 text-sm leading-7 text-fixed-dim">
                ستتواصل الإدارة معك لمراجعة البيانات واستكمال خطوات النشر.
              </p>
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
                <Field label="الرقم القومي اختياري">
                  <input {...register('ownerNationalId')} dir="ltr" disabled={isPending} className="form-input" />
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
                <Field label="المساحة بالمتر" error={errors.areaSqm?.message}>
                  <input type="number" {...register('areaSqm')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="الدور" error={errors.floor?.message}>
                  <input type="number" {...register('floor')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="عدد الغرف" error={errors.bedrooms?.message}>
                  <input type="number" {...register('bedrooms')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="الإيجار الشهري" error={errors.monthlyRent?.message}>
                  <input type="number" {...register('monthlyRent')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="التأمين" error={errors.depositAmount?.message}>
                  <input type="number" {...register('depositAmount')} disabled={isPending} className="form-input" />
                </Field>
              </div>
              <Field label="الأساسيات">
                <textarea {...register('basics')} disabled={isPending} className="form-input min-h-24 resize-y" />
              </Field>
              <Field label="المميزات والخدمات">
                <textarea {...register('amenities')} disabled={isPending} className="form-input min-h-24 resize-y" />
              </Field>
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
                  أوافق على سياسة الاسترجاع وشروط نشر الإعلان، وأقر بأن نشر الإعلان لا يتم إلا بعد مراجعة وموافقة الإدارة.
                  <Link className="mx-1 font-black text-tertiary hover:underline" to={ROUTES.REFUND_POLICY}>سياسة الاسترجاع</Link>
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
