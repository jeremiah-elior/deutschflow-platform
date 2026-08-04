const env = import.meta.env;

function clean(value: unknown, fallback: string) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

export const siteConfig = {
  name: 'DeutschFlow',
  siteUrl: clean(env.VITE_SITE_URL, 'https://deutschflow.app'),
  supportEmail: clean(env.VITE_SUPPORT_EMAIL, 'support@deutschflow.app'),
  privacyEmail: clean(env.VITE_PRIVACY_EMAIL, clean(env.VITE_SUPPORT_EMAIL, 'support@deutschflow.app')),
  legalName: clean(env.VITE_LEGAL_NAME, 'REPLACE_WITH_LEGAL_NAME'),
  legalStreet: clean(env.VITE_LEGAL_STREET, 'REPLACE_WITH_STREET_AND_NUMBER'),
  legalCity: clean(env.VITE_LEGAL_CITY, 'REPLACE_WITH_POSTCODE_AND_CITY'),
  legalCountry: clean(env.VITE_LEGAL_COUNTRY, 'Germany'),
  googlePlayUrl: clean(env.VITE_GOOGLE_PLAY_URL, ''),
  appStoreUrl: clean(env.VITE_APP_STORE_URL, ''),
  lastUpdated: '4 August 2026'
};

export function mailto(subject: string, body = '') {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${siteConfig.supportEmail}?${params.toString()}`;
}
