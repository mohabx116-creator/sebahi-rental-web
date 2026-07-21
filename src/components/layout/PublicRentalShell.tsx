import { useEffect } from 'react';
import { Home, Megaphone } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import dalilSubhiLogo from '../../assets/dalil-subhi-logo.jpg';
import { ROUTES } from '../../lib/constants/routes';
import Footer from './Footer';

const RENTALS_ORIGIN = 'https://rentals-ds-core-91.dalilsubhi.com';

function updateHeadTag(
  selector: string,
  create: () => HTMLElement,
  update: (element: HTMLElement) => void,
): void {
  const element = document.head.querySelector(selector) as HTMLElement | null;
  if (element) {
    update(element);
    return;
  }

  const created = create();
  update(created);
  document.head.appendChild(created);
}

function setSeoMetadata(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const canonicalPath = normalizedPath === '/' ? '/rentals' : normalizedPath;

  const seoMap: Record<string, { title: string; description: string }> = {
    '/rentals': {
      title: 'إيجارات المنطقة | داليل السبحي',
      description: 'البوابة الرسمية لإيجارات داليل السبحي لعرض الإعلانات المتاحة والتواصل مع المالكين.',
    },
    '/owners/list-your-unit': {
      title: 'أعلن عن وحدتك | داليل السبحي',
      description: 'قدّم بيانات الوحدة والمرفقات من بوابة الإيجارات الرسمية لنشر إعلانك بسرعة.',
    },
  };

  const seo =
    seoMap[normalizedPath] ??
    (normalizedPath.startsWith('/rentals/reservations/')
      ? {
          title: 'تأكيد الحجز | داليل السبحي',
          description: 'راجع تفاصيل الحجز قبل إتمام الطلب عبر بوابة الإيجارات الرسمية.',
        }
      : normalizedPath.endsWith('/contact')
        ? {
            title: 'تواصل بشأن الإعلان | داليل السبحي',
            description: 'تواصل مع المالك أو أكمل بيانات التواصل الخاصة بالإعلان من صفحة الإيجارات.',
          }
        : normalizedPath.startsWith('/rentals/')
          ? {
              title: 'تفاصيل الإعلان | داليل السبحي',
              description: 'اطلع على تفاصيل الإعلان وصور الوحدة من بوابة الإيجارات الرسمية.',
            }
          : {
              title: 'إيجارات المنطقة | داليل السبحي',
              description: 'البوابة الرسمية لإيجارات داليل السبحي لعرض الإعلانات المتاحة والتواصل مع المالكين.',
            });

  document.title = seo.title;

  updateHeadTag(
    'meta[name="description"]',
    () => document.createElement('meta'),
    (element) => {
      element.setAttribute('name', 'description');
      element.setAttribute('content', seo.description);
    },
  );

  updateHeadTag(
    'meta[property="og:title"]',
    () => document.createElement('meta'),
    (element) => {
      element.setAttribute('property', 'og:title');
      element.setAttribute('content', seo.title);
    },
  );

  updateHeadTag(
    'meta[property="og:description"]',
    () => document.createElement('meta'),
    (element) => {
      element.setAttribute('property', 'og:description');
      element.setAttribute('content', seo.description);
    },
  );

  updateHeadTag(
    'meta[property="og:url"]',
    () => document.createElement('meta'),
    (element) => {
      element.setAttribute('property', 'og:url');
      element.setAttribute('content', `${RENTALS_ORIGIN}${canonicalPath}`);
    },
  );

  updateHeadTag(
    'meta[name="twitter:title"]',
    () => document.createElement('meta'),
    (element) => {
      element.setAttribute('name', 'twitter:title');
      element.setAttribute('content', seo.title);
    },
  );

  updateHeadTag(
    'meta[name="twitter:description"]',
    () => document.createElement('meta'),
    (element) => {
      element.setAttribute('name', 'twitter:description');
      element.setAttribute('content', seo.description);
    },
  );

  updateHeadTag(
    'link[rel="canonical"]',
    () => document.createElement('link'),
    (element) => {
      element.setAttribute('rel', 'canonical');
      element.setAttribute('href', `${RENTALS_ORIGIN}${canonicalPath}`);
    },
  );
}

export function PublicRentalShell() {
  const location = useLocation();

  useEffect(() => {
    setSeoMetadata(location.pathname);
  }, [location.pathname]);

  return (
    <div className="rentals-light min-h-dvh bg-[#f7f2e8] font-sans text-[#1f2c22]">
      <header className="sticky top-0 z-40 border-b border-[#e4dac5] bg-white/80 shadow-[0_12px_40px_rgba(28,45,34,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to={ROUTES.RENTALS}>
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[#e4dac5] bg-white shadow-lg shadow-[0_10px_30px_rgba(28,45,34,0.08)]">
              <img src={dalilSubhiLogo} alt="دليل السبحي" className="h-full w-full object-contain mix-blend-multiply" />
            </span>
            <div className="text-right">
              <p className="text-sm font-black text-[#1f2c22] sm:text-base">إيجارات المنطقة</p>
              <p className="hidden text-xs font-medium text-[#5f6e62] sm:block">بوابة متخصصة للإيجارات للمنطقة</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm font-bold text-[#1f2c22]">
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 transition duration-200 hover:bg-[#f3ede2] hover:text-tertiary"
              href="https://dalilsubhi.com/"
            >
              دليل السبحي
            </a>
            <Link
              className="hidden items-center gap-2 rounded-full px-4 py-2 transition duration-200 hover:bg-[#f3ede2] hover:text-tertiary md:inline-flex"
              to={ROUTES.OWNER_LIST_UNIT}
            >
              <Megaphone className="h-4 w-4 text-tertiary" />
              أعلن عن وحدتك
            </Link>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-5 py-2 text-white shadow-lg shadow-secondary/20 transition duration-200 hover:bg-secondary/90"
              to={ROUTES.RENTALS}
            >
              <Home className="h-4 w-4" />
              الإيجارات
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />

      <Footer />
    </div>
  );
}
