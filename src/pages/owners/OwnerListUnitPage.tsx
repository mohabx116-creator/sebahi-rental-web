import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, FileImage, Home, Loader2, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError } from '../../lib/api/api-client';
import { createCloudinaryUploadSignature, createOwnerSubmission } from '../../lib/api/rental-service';
import type { OwnerSubmissionImageInput } from '../../lib/api/types';
import { ROUTES } from '../../lib/constants/routes';
import { furnishingLabels, listingTypeLabels, publicRentalBrand } from '../rentals/rental-format';

const optionalEmail = z.string().trim().email('Ø§ÙƒØªØ¨ Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØµØ­ÙŠØ­').optional().or(z.literal(''));

const MAX_OWNER_IMAGES = 12;
const MAX_OWNER_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_OWNER_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const ownerSubmissionSchema = z.object({
  ownerName: z.string().trim().min(2, 'Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ù…Ø§Ù„Ùƒ'),
  ownerPhone: z.string().trim().min(5, 'Ø§ÙƒØªØ¨ Ø±Ù‚Ù… Ù…ÙˆØ¨Ø§ÙŠÙ„ ØµØ­ÙŠØ­'),
  ownerEmail: optionalEmail,
  ownerNationalId: z.string().trim().optional(),
  preferredContactMethod: z.string().trim().optional(),
  listingType: z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'DUPLEX', 'OFFICE', 'SHOP']),
  title: z.string().trim().min(3, 'Ø§ÙƒØªØ¨ Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†'),
  description: z.string().trim().min(10, 'Ø§ÙƒØªØ¨ ÙˆØµÙØ§ Ø£ÙˆØ¶Ø­ Ù„Ù„ÙˆØ­Ø¯Ø©'),
  addressText: z.string().trim().optional(),
  locationText: z.string().trim().optional(),
  floor: z.number().int().optional(),
  areaSqm: z.number().positive('Ø§ÙƒØªØ¨ Ù…Ø³Ø§Ø­Ø© ØµØ­ÙŠØ­Ø©'),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  furnishingStatus: z.enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED']),
  monthlyRent: z.number().positive('Ø§ÙƒØªØ¨ Ø¥ÙŠØ¬Ø§Ø±Ø§ Ø´Ù‡Ø±ÙŠØ§ ØµØ­ÙŠØ­Ø§'),
  depositAmount: z.number().nonnegative().optional(),
  policyAccepted: z.boolean().refine((value) => value === true, 'ÙŠØ¬Ø¨ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø¹Ù„Ù‰ Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹ ÙˆØ´Ø±ÙˆØ· Ø§Ù„Ù†Ø´Ø±'),
});

type OwnerSubmissionFormValues = z.infer<typeof ownerSubmissionSchema>;

function optionalNumber(value: unknown) {
  return value === '' || value === null || value === undefined ? undefined : Number(value);
}

function getUploadErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 503) {
    return 'Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± ØºÙŠØ± Ù…ÙØ¹Ù„ Ø­Ø§Ù„ÙŠØ§. ÙŠØ¬Ø¨ Ø¥Ø¹Ø¯Ø§Ø¯ Cloudinary ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù… Ù‚Ø¨Ù„ Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø·Ù„Ø¨Ø§Øª Ø¥Ø¹Ù„Ø§Ù† Ø¬Ø¯ÙŠØ¯Ø©.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'ØªØ¹Ø°Ø± Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø£Ùˆ ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¯Ø¹Ù….';
}

function validateOwnerImageFile(file: File) {
  if (!ALLOWED_OWNER_IMAGE_TYPES.has(file.type)) {
    throw new Error('Ù†ÙˆØ¹ Ø§Ù„ØµÙˆØ±Ø© ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…. Ø§Ø³ØªØ®Ø¯Ù… JPG Ø£Ùˆ PNG Ø£Ùˆ WebP ÙÙ‚Ø·.');
  }

  if (file.size > MAX_OWNER_IMAGE_BYTES) {
    throw new Error('Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø© ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØªØ¬Ø§ÙˆØ² 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª.');
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
  } = useForm<OwnerSubmissionFormValues>({
    resolver: zodResolver(ownerSubmissionSchema),
    defaultValues: {
      listingType: 'APARTMENT',
      furnishingStatus: 'FURNISHED',
      preferredContactMethod: 'PHONE',
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
      throw new Error('Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø© ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù….');
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
      throw new Error('ØªØ¹Ø°Ø± Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø© Ø¥Ù„Ù‰ Ø®Ø¯Ù…Ø© Ø§Ù„ØªØ®Ø²ÙŠÙ†.');
    }

    const result = await response.json() as { secure_url?: string; public_id?: string; bytes?: number; resource_type?: string };
    if (!result.secure_url) {
      throw new Error('Ø®Ø¯Ù…Ø© Ø§Ù„ØªØ®Ø²ÙŠÙ† Ù„Ù… ØªØ±Ø¬Ø¹ Ø±Ø§Ø¨Ø· ØµÙˆØ±Ø© ØµØ§Ù„Ø­Ø§.');
    }
    if (result.resource_type && result.resource_type !== 'image') {
      throw new Error('Ø®Ø¯Ù…Ø© Ø§Ù„ØªØ®Ø²ÙŠÙ† Ù„Ù… ØªØ±Ø¬Ø¹ Ù…Ù„Ù ØµÙˆØ±Ø© ØµØ§Ù„Ø­Ø§.');
    }
    if (result.bytes && result.bytes > MAX_OWNER_IMAGE_BYTES) {
      throw new Error('Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ù…Ø±ÙÙˆØ¹Ø© ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ø¯ Ø§Ù„Ù…Ø³Ù…ÙˆØ­.');
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
    if (remainingSlots <= 0) {
      setUploadError('Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø±ÙØ¹ Ø£ÙƒØ«Ø± Ù…Ù† 12 ØµÙˆØ±Ø© Ù„Ù„ÙˆØ­Ø¯Ø©.');
      return;
    }
    if (selectedFiles.length > remainingSlots) {
      setUploadError(`ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¶Ø§ÙØ© ${remainingSlots} ØµÙˆØ±Ø© ÙÙ‚Ø· Ù„Ø¥ÙƒÙ…Ø§Ù„ Ø­Ø¯ 12 ØµÙˆØ±Ø©.`);
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

  const onSubmit = handleSubmit(async (values: OwnerSubmissionFormValues) => {
    setUploadError('');
    if (images.length === 0) {
      setUploadError('ÙŠØ¬Ø¨ Ø±ÙØ¹ ØµÙˆØ±Ø© ÙˆØ§Ø­Ø¯Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ Ù…Ù† Ø®Ù„Ø§Ù„ Ø®Ø¯Ù…Ø© Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù‚Ø¨Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨.');
      return;
    }

    await submissionMutation.mutateAsync({
      ...values,
      ownerEmail: values.ownerEmail || undefined,
      ownerNationalId: values.ownerNationalId || undefined,
      preferredContactMethod: values.preferredContactMethod || undefined,
      addressText: values.addressText || undefined,
      locationText: values.locationText || undefined,
      images,
      policyAccepted: true as const,
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
              Ø£Ø¹Ù„Ù† Ø¹Ù† ÙˆØ­Ø¯ØªÙƒ
            </span>
            <h1 className="mt-5 text-3xl font-black leading-[1.35] text-fixed sm:text-5xl">
              Ø£Ø¹Ù„Ù† Ø¹Ù† ÙˆØ­Ø¯ØªÙƒ Ø¯Ø§Ø®Ù„ {publicRentalBrand.compoundAr}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-fixed-dim">
              Ø£Ø±Ø³Ù„ Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ­Ø¯ØªÙƒ Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©ØŒ ÙˆØ³ÙŠØªÙ… Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡Ø§ Ù‚Ø¨Ù„ Ø§Ù„Ù†Ø´Ø±. Ù„Ø§ ÙŠØªÙ… Ù†Ø´Ø± Ø£ÙŠ Ø¥Ø¹Ù„Ø§Ù† Ø¥Ù„Ø§ Ø¨Ø¹Ø¯ Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.
            </p>
          </div>
          <div className="rounded-[28px] border border-secondary/35 bg-secondary/20 p-5">
            <ShieldCheck className="h-8 w-8 text-tertiary" />
            <p className="mt-3 text-lg font-black text-fixed">Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù‚ÙŠØ¯ Ø§Ù„ØªØ¬Ù‡ÙŠØ²</p>
            <p className="mt-2 text-sm leading-7 text-fixed-dim">
              Ø±Ø³ÙˆÙ… Ù†Ø´Ø± Ø§Ù„Ø¥Ø¹Ù„Ø§Ù† Ù„Ø§ ÙŠØªÙ… ØªØ­ØµÙŠÙ„Ù‡Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ù†ØµØ© Ø­Ø§Ù„ÙŠØ§ØŒ ÙˆØ³ÙŠØªÙ… ØªÙØ¹ÙŠÙ„Ù‡Ø§ Ø¨Ø¹Ø¯ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø¯ÙØ¹.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] glass-panel p-5 text-right shadow-xl">
            <h2 className="text-xl font-black text-fixed">Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù†Ø´Ø±</h2>
            <ol className="mt-5 space-y-3 text-sm leading-7 text-fixed-dim">
              {[
                'Ø£Ø±Ø³Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ÙˆØ­Ø¯Ø©',
                'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ØªØ±Ø§Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨',
                'ÙŠØªÙ… Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ù„Ø§Ø³ØªÙƒÙ…Ø§Ù„ Ø§Ù„Ù†Ø´Ø± ÙˆØ§Ù„Ø¯ÙØ¹ Ø¹Ù†Ø¯ ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø®Ø¯Ù…Ø©',
                'ÙŠØªÙ… Ù†Ø´Ø± Ø§Ù„Ø¥Ø¹Ù„Ø§Ù† Ø¨Ø¹Ø¯ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø©',
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
            <p className="font-black text-fixed">Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹</p>
            <p className="mt-2">Ø±Ø³ÙˆÙ… Ù†Ø´Ø± Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†ØŒ Ø¹Ù†Ø¯ ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØŒ Ù„Ø§ ØªÙƒÙˆÙ† Ù…Ø³ØªØ±Ø¯Ø© Ø¨Ø¹Ø¯ Ù†Ø´Ø± Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†.</p>
            <Link className="mt-3 inline-flex font-black text-tertiary hover:underline" to={ROUTES.REFUND_POLICY}>
              Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø³ÙŠØ§Ø³Ø© ÙƒØ§Ù…Ù„Ø©
            </Link>
          </div>
        </aside>

        <div className="space-y-6">
          {success && (
            <section className="rounded-[28px] border border-secondary/35 bg-secondary/20 p-6 text-right">
              <CheckCircle2 className="h-10 w-10 text-tertiary" />
              <h2 className="mt-4 text-2xl font-black text-fixed">ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø¥Ø¹Ù„Ø§Ù† ÙˆØ­Ø¯ØªÙƒ Ø¨Ù†Ø¬Ø§Ø­.</h2>
              <p className="mt-2 text-sm leading-7 text-fixed-dim">
                Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: <span className="font-mono font-black text-tertiary" dir="ltr">{success.id}</span>
              </p>
              <p className="mt-2 text-sm leading-7 text-fixed-dim">
                Ø³ØªØªÙˆØ§ØµÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ù…Ø¹Ùƒ Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ§Ø³ØªÙƒÙ…Ø§Ù„ Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù†Ø´Ø±.
              </p>
            </section>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <FormSection title="Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø§Ù„Ùƒ">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ø§Ø³Ù… Ø§Ù„Ù…Ø§Ù„Ùƒ" error={errors.ownerName?.message}>
                  <input {...register('ownerName')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„" error={errors.ownerPhone?.message}>
                  <input {...register('ownerPhone')} dir="ltr" disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø§Ø®ØªÙŠØ§Ø±ÙŠ" error={errors.ownerEmail?.message}>
                  <input {...register('ownerEmail')} dir="ltr" type="email" disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ù…ÙØ¶Ù„Ø©">
                  <select {...register('preferredContactMethod')} disabled={isPending} className="form-input">
                    <option value="PHONE">Ø§ØªØµØ§Ù„ Ù‡Ø§ØªÙÙŠ</option>
                    <option value="WHATSAPP">ÙˆØ§ØªØ³Ø§Ø¨</option>
                    <option value="EMAIL">Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</option>
                  </select>
                </Field>
              </div>
            </FormSection>

            <FormSection title="Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ÙˆØ­Ø¯Ø©">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ù†ÙˆØ¹ Ø§Ù„ÙˆØ­Ø¯Ø©" error={errors.listingType?.message}>
                  <select {...register('listingType')} disabled={isPending} className="form-input">
                    {Object.entries(listingTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ø­Ø§Ù„Ø© Ø§Ù„ÙØ±Ø´" error={errors.furnishingStatus?.message}>
                  <select {...register('furnishingStatus')} disabled={isPending} className="form-input">
                    {Object.entries(furnishingLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†" error={errors.title?.message}>
                  <input {...register('title')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¯Ø§Ø®Ù„ Ø§Ù„ÙƒÙ…Ø¨Ø§ÙˆÙ†Ø¯" error={errors.locationText?.message}>
                  <input {...register('locationText')} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø§Ù„Ù…Ø³Ø§Ø­Ø© Ø¨Ø§Ù„Ù…ØªØ±" error={errors.areaSqm?.message}>
                  <input type="number" {...register('areaSqm', { setValueAs: optionalNumber })} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø§Ù„Ø¯ÙˆØ±" error={errors.floor?.message}>
                  <input type="number" {...register('floor', { setValueAs: optionalNumber })} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø¹Ø¯Ø¯ Ø§Ù„ØºØ±Ù" error={errors.bedrooms?.message}>
                  <input type="number" {...register('bedrooms', { setValueAs: optionalNumber })} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø¹Ø¯Ø¯ Ø§Ù„Ø­Ù…Ø§Ù…Ø§Øª" error={errors.bathrooms?.message}>
                  <input type="number" {...register('bathrooms', { setValueAs: optionalNumber })} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø§Ù„Ø¥ÙŠØ¬Ø§Ø± Ø§Ù„Ø´Ù‡Ø±ÙŠ" error={errors.monthlyRent?.message}>
                  <input type="number" {...register('monthlyRent', { setValueAs: optionalNumber })} disabled={isPending} className="form-input" />
                </Field>
                <Field label="Ø§Ù„ØªØ£Ù…ÙŠÙ† Ø§Ø®ØªÙŠØ§Ø±ÙŠ" error={errors.depositAmount?.message}>
                  <input type="number" {...register('depositAmount', { setValueAs: optionalNumber })} disabled={isPending} className="form-input" />
                </Field>
              </div>
              <Field label="Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ØªÙØµÙŠÙ„ÙŠ" error={errors.addressText?.message}>
                <input {...register('addressText')} disabled={isPending} className="form-input" />
              </Field>
              <Field label="ÙˆØµÙ Ø§Ù„ÙˆØ­Ø¯Ø©" error={errors.description?.message}>
                <textarea {...register('description')} disabled={isPending} className="form-input min-h-32 resize-y" />
              </Field>
            </FormSection>

            <FormSection title="ØµÙˆØ± Ø§Ù„ÙˆØ­Ø¯Ø©">
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-outline/30 bg-primary/40 p-6 text-center hover:border-tertiary/40 transition">
                {isUploading ? <Loader2 className="h-9 w-9 animate-spin text-tertiary" /> : <UploadCloud className="h-9 w-9 text-tertiary" />}
                <span className="mt-3 text-sm font-black text-fixed">Ø±ÙØ¹ ØµÙˆØ± Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù„Ù„ÙˆØ­Ø¯Ø©</span>
                <span className="mt-1 text-xs leading-6 text-fixed-dim">
                  ÙŠØªÙ… Ø§Ù„Ø±ÙØ¹ Ø¥Ù„Ù‰ Cloudinary Ø¹Ù†Ø¯ ØªÙØ¹ÙŠÙ„ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„ØªØ®Ø²ÙŠÙ† ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù….
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
                      <img alt={image.altText ?? 'ØµÙˆØ±Ø© Ø§Ù„ÙˆØ­Ø¯Ø©'} src={image.url} className="aspect-[4/3] w-full object-cover" decoding="async" loading="lazy" />
                      <div className="flex items-center justify-between gap-2 p-3">
                        <button type="button" onClick={() => markCover(index)} className={image.isCover ? "rounded-full bg-secondary/35 border border-secondary/20 px-3 py-1 text-xs font-black text-white" : "rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-black text-fixed hover:bg-white/10"}>
                          {image.isCover ? 'ØµÙˆØ±Ø© Ø§Ù„ØºÙ„Ø§Ù' : 'Ø§Ø®ØªÙŠØ§Ø± ÙƒØºÙ„Ø§Ù'}
                        </button>
                        <button type="button" onClick={() => removeImage(index)} className="rounded-full p-2 text-error hover:bg-error/10 transition" aria-label="Ø­Ø°Ù Ø§Ù„ØµÙˆØ±Ø©">
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
                  Ø£ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹ ÙˆØ´Ø±ÙˆØ· Ù†Ø´Ø± Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†ØŒ ÙˆØ£Ù‚Ø± Ø¨Ø£Ù† Ù†Ø´Ø± Ø§Ù„Ø¥Ø¹Ù„Ø§Ù† Ù„Ø§ ÙŠØªÙ… Ø¥Ù„Ø§ Ø¨Ø¹Ø¯ Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆÙ…ÙˆØ§ÙÙ‚Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.
                  <Link className="mx-1 text-tertiary hover:underline font-black" to={ROUTES.REFUND_POLICY}>Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹</Link>
                </span>
              </label>
              {errors.policyAccepted && <p className="mt-2 text-sm font-bold text-error">{errors.policyAccepted.message}</p>}
            </section>

            {submissionMutation.isError && (
              <p className="rounded-2xl border border-error/25 bg-error/10 p-4 text-sm font-bold leading-7 text-error">
                {submissionMutation.error instanceof Error ? submissionMutation.error.message : 'ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†.'}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tertiary hover:bg-tertiary/90 px-6 py-4 text-base font-black text-primary transition shadow-xl shadow-tertiary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <FileImage className="h-5 w-5 text-primary" />}
              {isPending ? 'Ø¬Ø§Ø± Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨...' : 'Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†'}
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

