const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const withBase = (path: string) => {
  const trimmed = path.replace(/^\//, '');
  if (!trimmed) return baseUrl;
  return `${baseUrl}${trimmed.replace(/\/$/, '')}/`;
};

export const withAsset = (path: string) => encodeURI(`${baseUrl}${path.replace(/^\//, '')}`);

export const siteConfig = {
  companyName: 'Anchor Timber',
  owner: 'Andy Pipher',
  phone: '(970) 555-0123',
  phoneHref: 'tel:+19705550123',
  location: 'Crawford, Colorado',
  address: 'Crawford, CO',
  serviceArea: 'Serving Crawford + the Western Slope',
  hours: 'Mon-Fri: 8am-5pm (placeholder)',
  leadTime: '1-3 weeks (placeholder)',
  accentColor: '#C28B4A',
  cta: {
    primary: 'Request a Quote',
    secondary: 'Call/Text',
    tertiary: 'View Products'
  },
  tagline:
    'Aspen Tongue & Groove - Custom Milling - Slabs - 40ft Beams - Crawford, CO',
  description:
    'Custom milling, Aspen tongue-and-groove, slabs, beams, and premium lumber from Crawford, Colorado.',
};
