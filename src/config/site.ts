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
  serviceArea: 'Serving the western slope & beyond.',
  hours: 'Mon-Fri: 8am-5pm (placeholder)',
  leadTime: 'Dependant on order',
  accentColor: '#C28B4A',
  cta: {
    primary: 'Request a Quote',
    secondary: 'Call/Text',
    tertiary: 'View Products'
  },
  tagline:
    'Aspen Tongue & Groove - Custom Milling - Blue Stain Pine - 40ft Beams - Crawford, CO',
  description:
    'Custom milling, Aspen tongue-and-groove, Blue Stain Pine, beams, and premium lumber from Crawford, Colorado.',
};
