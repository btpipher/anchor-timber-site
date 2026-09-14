import business from '../content/business.json';

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const withBase = (path: string) => {
  const hashAt = path.indexOf('#');
  const hash = hashAt >= 0 ? path.slice(hashAt) : '';
  const pathname = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const trimmed = pathname.replace(/^\//, '');
  if (!trimmed) return baseUrl;
  return `${baseUrl}${trimmed.replace(/\/$/, '')}/${hash}`;
};

export const withAsset = (path: string) => encodeURI(`${baseUrl}${path.replace(/^\//, '')}`);

export const phoneLink = (phone: string) => `tel:+1${phone.replace(/\D/g, '').replace(/^1/, '')}`;

export const siteConfig = {
  ...business,
  phoneHref: phoneLink(business.phone),
  leadTime: 'Dependant on order',
  accentColor: '#284438',
  cta: {
    primary: 'Request a Quote',
    secondary: 'Call/Text',
    tertiary: 'View Products'
  },
  tagline:
    'Aspen Tongue & Groove - Custom Milling - Blue Stain Pine - 40ft Beams - Crawford, CO',
  description:
    'Custom milling, Aspen tongue-and-groove, Blue Stain Pine, beams, and lumber from Crawford, Colorado.',
};
