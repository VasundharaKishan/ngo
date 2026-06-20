const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initAnalytics() {
  if (!GA_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });
}

export function trackPageView(path: string, title?: string) {
  if (!GA_ID) return;
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (!GA_ID) return;
  window.gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
