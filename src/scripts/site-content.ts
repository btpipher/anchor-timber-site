import { createClient } from '@supabase/supabase-js';

const configElement = document.querySelector<HTMLScriptElement>('#content-config');
if (!configElement?.textContent) throw new Error('Content configuration is missing.');

const config = JSON.parse(configElement.textContent) as {
  supabaseUrl: string;
  supabaseKey: string;
  baseUrl: string;
};

const getValue = (object: Record<string, any>, path: string) => path.split('.').reduce((value, key) => value?.[key], object);
const assetUrl = (source: string) => /^https?:\/\//.test(source) ? source : `${config.baseUrl}${source.replace(/^\//, '')}`;
const phoneUrl = (phone: string) => `tel:+1${phone.replace(/\D/g, '').replace(/^1/, '')}`;

const element = (tag: string, className?: string, text?: string) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const renderSawmillHomeProducts = (container: HTMLElement, products: any[]) => {
  const detailUrl = container.dataset.detailUrl || '#';
  container.replaceChildren(...products.map((product) => {
    const link = element('a', 'product-feature') as HTMLAnchorElement;
    link.href = detailUrl;
    const figure = element('figure');
    const image = element('img') as HTMLImageElement;
    image.src = assetUrl(product.image);
    image.alt = product.imageAlt;
    image.loading = 'lazy';
    const copy = element('div', 'product-feature-copy');
    const status = element('div', 'product-status');
    status.append(element('span', '', product.availability), element('span', '', product.price));
    copy.append(status, element('h3', '', product.name), element('p', '', product.description), element('span', 'text-link', 'Details'));
    figure.append(image);
    link.append(figure, copy);
    return link;
  }));
};

const renderSawmillCatalog = (container: HTMLElement, products: any[]) => {
  container.replaceChildren(...products.map((product) => {
    const article = element('article', 'catalog-item');
    const image = element('img') as HTMLImageElement;
    image.src = assetUrl(product.image);
    image.alt = product.imageAlt;
    image.loading = 'lazy';
    const copy = element('div');
    copy.append(element('p', 'product-availability', product.availability), element('h3', '', product.name), element('p', '', product.description));
    article.append(image, copy, element('strong', '', product.price));
    return article;
  }));
};

const renderFirewoodProducts = (container: HTMLElement, products: any[]) => {
  container.replaceChildren(...products.map((product) => {
    const article = element('article', 'firewood-product');
    const image = element('img') as HTMLImageElement;
    image.src = assetUrl(product.image);
    image.alt = product.imageAlt;
    image.loading = 'lazy';
    const row = element('div', 'firewood-product-copy');
    const copy = element('div');
    copy.append(element('p', 'product-availability', product.availability), element('h3', '', product.name), element('p', '', product.description));
    row.append(copy, element('strong', '', product.price));
    article.append(image, row);
    return article;
  }));
};

const renderGallery = (container: HTMLElement, photos: any[]) => {
  if (container.dataset.liveGalleryLayout === 'sawmill') {
    container.replaceChildren(...photos.map((photo, index) => {
      const figure = element('figure', 'gallery-photo');
      const button = element('button', 'gallery-trigger') as HTMLButtonElement;
      button.type = 'button';
      button.dataset.lightboxSrc = assetUrl(photo.image);
      button.dataset.lightboxAlt = photo.alt;
      button.setAttribute('aria-label', `Open sawmill photo ${index + 1}`);
      const image = element('img') as HTMLImageElement;
      image.src = assetUrl(photo.image);
      image.alt = photo.alt;
      image.loading = 'lazy';
      button.append(image);
      figure.append(button);
      return figure;
    }));
    return;
  }

  container.replaceChildren(...photos.map((photo) => {
    const image = element('img') as HTMLImageElement;
    image.src = assetUrl(photo.image);
    image.alt = photo.alt;
    image.loading = 'lazy';
    return image;
  }));
};

const applyContent = (content: Record<string, any>) => {
  document.querySelectorAll<HTMLElement>('[data-live-text]').forEach((node) => {
    const value = getValue(content, node.dataset.liveText!);
    if (typeof value === 'string') node.textContent = value;
  });

  document.querySelectorAll<HTMLAnchorElement>('[data-live-phone-href]').forEach((link) => {
    const value = getValue(content, link.dataset.livePhoneHref!);
    if (typeof value === 'string') link.href = phoneUrl(value);
  });

  document.querySelectorAll<HTMLImageElement>('[data-live-image]').forEach((image) => {
    const source = getValue(content, image.dataset.liveImage!);
    const alt = image.dataset.liveAlt ? getValue(content, image.dataset.liveAlt) : undefined;
    if (typeof source === 'string') image.src = assetUrl(source);
    if (typeof alt === 'string') image.alt = alt;
  });

  document.querySelectorAll<HTMLElement>('[data-live-products]').forEach((container) => {
    const [section, layout] = container.dataset.liveProducts!.split(':');
    const products = content[section]?.products;
    if (!Array.isArray(products)) return;
    if (layout === 'home') renderSawmillHomeProducts(container, products);
    if (layout === 'catalog') renderSawmillCatalog(container, products);
    if (layout === 'firewood') renderFirewoodProducts(container, products);
  });

  document.querySelectorAll<HTMLElement>('[data-live-gallery]').forEach((container) => {
    const photos = getValue(content, container.dataset.liveGallery!);
    if (Array.isArray(photos)) renderGallery(container, photos);
  });
};

if (config.supabaseUrl && config.supabaseKey) {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.from('site_content').select('id, value');
  if (!error && data?.length) {
    applyContent(Object.fromEntries(data.map((row) => [row.id, row.value])));
  }
}
