import { CreditCard, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../lib/constants/routes';

const policyItems = [
  'لا يتم نشر أي إعلان إلا بعد مراجعة وموافقة الإدارة.',
  'رسوم نشر الإعلان، عند تفعيل الدفع الإلكتروني، لا تكون مستردة بعد نشر الإعلان.',
  'إذا تم رفض طلب الإعلان قبل النشر وبعد الدفع، تتم مراجعة حالة الاسترداد وفق سبب الرفض وسياسة المنصة.',
  'أي استرداد يتم من خلال نفس وسيلة الدفع الأصلية ووفق قواعد بوابة الدفع.',
  'لا يتم اعتبار أي دفع ناجحا إلا بعد تأكيده من بوابة الدفع والخادم.',
  'عند عدم تفعيل Paymob بعد، لا يتم تحصيل أي رسوم إعلان إلكترونية داخل المنصة.',
  'تحتفظ المنصة بحق رفض الإعلانات غير المكتملة أو المخالفة أو غير المطابقة لسياسة الكمباوند.',
];

export function RefundPolicyPage() {
  return (
    <main className="bg-background pb-16">
      <section className="border-b border-outline-variant/50 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 text-right sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-black text-secondary">
            <FileText className="h-4 w-4" />
            سياسة الاسترجاع
          </span>
          <h1 className="mt-5 text-3xl font-black leading-[1.35] text-primary sm:text-5xl">
            سياسة الاسترجاع وشروط نشر إعلانات الإيجار
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-on-surface-variant">
            هذه صياغة عملية واضحة لمرحلة تجهيز المدفوعات. يجب مراجعة الشروط القانونية الكاملة قبل تفعيل أي مدفوعات حقيقية.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-outline-variant/60 bg-white p-5 text-right shadow-xl shadow-primary/5 sm:p-7">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-secondary" />
            <div>
              <h2 className="text-2xl font-black text-primary">نقاط السياسة</h2>
              <ul className="mt-5 space-y-3 text-sm leading-8 text-on-surface-variant">
                {policyItems.map((item) => (
                  <li key={item} className="rounded-2xl bg-surface-container-low p-4">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-secondary/20 bg-secondary/10 p-5 text-right">
          <CreditCard className="h-7 w-7 text-secondary" />
          <h2 className="mt-3 text-xl font-black text-primary">حالة الدفع الحالية</h2>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            الدفع الإلكتروني لرسوم نشر الإعلان قيد التجهيز وسيتم تفعيله بعد اعتماد بوابة الدفع. لا يوجد تحصيل رسوم إعلان إلكترونية داخل المنصة حاليا.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full bg-primary px-5 py-3 text-sm font-black text-white" to={ROUTES.OWNER_LIST_UNIT}>
            أعلن عن وحدتك
          </Link>
          <Link className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-black text-primary" to={ROUTES.RENTALS}>
            العودة إلى الإيجارات
          </Link>
        </div>
      </section>
    </main>
  );
}
