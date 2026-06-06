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
    <main className="pb-16 text-fixed">
      <section className="border-b border-outline/30 bg-primary/20">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 text-right sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-tertiary backdrop-blur-md">
            <FileText className="h-4 w-4 text-tertiary" />
            سياسة الاسترجاع
          </span>
          <h1 className="mt-5 text-3xl font-black leading-[1.35] text-fixed sm:text-5xl">
            سياسة الاسترجاع وشروط نشر إعلانات الإيجار
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-fixed-dim">
            هذه صياغة عملية واضحة لمرحلة تجهيز المدفوعات. يجب مراجعة الشروط القانونية الكاملة قبل تفعيل أي مدفوعات حقيقية.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] glass-panel p-5 text-right shadow-xl sm:p-7">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-tertiary" />
            <div>
              <h2 className="text-2xl font-black text-fixed">نقاط السياسة</h2>
              <ul className="mt-5 space-y-3 text-sm leading-8 text-fixed-dim">
                {policyItems.map((item) => (
                  <li key={item} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-secondary/35 bg-secondary/20 p-5 text-right">
          <CreditCard className="h-7 w-7 text-tertiary" />
          <h2 className="mt-3 text-xl font-black text-fixed">حالة الدفع الحالية</h2>
          <p className="mt-2 text-sm leading-7 text-fixed-dim">
            الدفع الإلكتروني لرسوم نشر الإعلان قيد التجهيز وسيتم تفعيله بعد اعتماد بوابة الدفع. لا يوجد تحصيل رسوم إعلان إلكترونية داخل المنصة حاليا.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full bg-tertiary hover:bg-tertiary/90 px-5 py-3 text-sm font-black text-primary transition shadow-lg shadow-tertiary/20" to={ROUTES.OWNER_LIST_UNIT}>
            أعلن عن وحدتك
          </Link>
          <Link className="rounded-full border border-outline bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-black text-fixed transition shadow-md" to={ROUTES.RENTALS}>
            العودة إلى الإيجارات
          </Link>
        </div>
      </section>
    </main>
  );
}
