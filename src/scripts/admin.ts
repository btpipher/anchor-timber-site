import { createClient } from '@supabase/supabase-js';

type Product = {
  name: string;
  description: string;
  price: string;
  availability: string;
  image: string;
  imageAlt: string;
};

type GalleryPhoto = { image: string; alt: string };
type SiteContent = Record<string, any>;

const configElement = document.querySelector<HTMLScriptElement>('#editor-config');
if (!configElement?.textContent) throw new Error('Editor configuration is missing.');

const config = JSON.parse(configElement.textContent) as {
  supabaseUrl: string;
  supabaseKey: string;
  adminEmail: string;
  baseUrl: string;
  siteUrl: string;
  localAssets: string[];
  initialContent: SiteContent;
};

const isConfigured = Boolean(config.supabaseUrl && config.supabaseKey && config.adminEmail);
const supabase = isConfigured ? createClient(config.supabaseUrl, config.supabaseKey) : null;
const loginPanel = document.querySelector<HTMLElement>('[data-login-panel]')!;
const loginForm = document.querySelector<HTMLFormElement>('[data-login-form]')!;
const connectionMessage = document.querySelector<HTMLElement>('[data-connection-message]')!;
const loginMessage = document.querySelector<HTMLElement>('[data-login-message]')!;
const editor = document.querySelector<HTMLElement>('[data-editor]')!;
const contentForm = document.querySelector<HTMLFormElement>('[data-content-form]')!;
const saveMessage = document.querySelector<HTMLElement>('[data-save-message]')!;
const unsavedMessage = document.querySelector<HTMLElement>('[data-unsaved-message]')!;
const uploadMessage = document.querySelector<HTMLElement>('[data-upload-message]')!;
const imagePicker = document.querySelector<HTMLElement>('[data-image-picker]')!;
const imagePickerGrid = document.querySelector<HTMLElement>('[data-image-picker-grid]')!;
const imagePickerSearch = document.querySelector<HTMLInputElement>('[data-image-picker-search]')!;

let content: SiteContent = structuredClone(config.initialContent);
let remoteAssets: string[] = [];
let dirty = false;
let activeImageSelect: HTMLSelectElement | null = null;

const field = (name: string) => contentForm.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)!;
const setField = (name: string, value = '') => { field(name).value = value; };
const getField = (name: string) => field(name).value.trim();

const displayUrl = (source: string) => {
  if (!source) return '';
  if (/^https?:\/\//.test(source)) return source;
  return `${config.baseUrl}${source.replace(/^\//, '')}`;
};

const assetLabel = (source: string) => {
  try {
    return decodeURIComponent(new URL(source, window.location.origin).pathname.split('/').pop() || source);
  } catch {
    return source;
  }
};

const setDirty = (value: boolean) => {
  dirty = value;
  unsavedMessage.textContent = value ? 'Unsaved changes' : 'No unsaved changes';
};

const allAssets = () => [...new Set([...config.localAssets, ...remoteAssets])];

const assetContext = (source: string) => {
  if (/^https?:\/\//.test(source)) return `Uploaded · ${assetLabel(source)}`;
  const parts = source.split('/').filter(Boolean);
  const folder = parts.at(-2)?.replace(/-/g, ' ') || 'Site photo';
  return `${folder} · ${assetLabel(source)}`;
};

const syncImageChoice = (select: HTMLSelectElement) => {
  const choice = select.closest<HTMLElement>('[data-image-choice]');
  if (!choice) return;
  const preview = choice.querySelector<HTMLImageElement>('[data-image-choice-preview]')!;
  const name = choice.querySelector<HTMLElement>('[data-image-choice-name]')!;
  preview.src = displayUrl(select.value);
  preview.hidden = !select.value;
  name.textContent = select.value ? assetContext(select.value) : 'No photo selected';
};

const closeImagePicker = () => {
  imagePicker.hidden = true;
  activeImageSelect = null;
  imagePickerSearch.value = '';
  document.body.style.overflow = '';
};

const chooseImage = (source: string) => {
  if (!activeImageSelect) return;
  activeImageSelect.value = source;
  activeImageSelect.dispatchEvent(new Event('change', { bubbles: true }));
  syncImageChoice(activeImageSelect);
  setDirty(true);
  closeImagePicker();
};

const renderImagePicker = (query = '') => {
  const normalizedQuery = query.trim().toLowerCase();
  const assets = allAssets().filter((source) => (
    !normalizedQuery || `${source} ${assetContext(source)}`.toLowerCase().includes(normalizedQuery)
  ));
  imagePickerGrid.replaceChildren();

  for (const source of assets) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'image-picker-card';
    if (source === activeImageSelect?.value) button.setAttribute('aria-current', 'true');
    const image = document.createElement('img');
    image.src = displayUrl(source);
    image.alt = '';
    image.loading = 'lazy';
    const name = document.createElement('span');
    name.textContent = assetContext(source);
    button.append(image, name);
    button.addEventListener('click', () => chooseImage(source));
    imagePickerGrid.append(button);
  }

  if (!assets.length) {
    const empty = document.createElement('p');
    empty.className = 'image-picker-empty';
    empty.textContent = 'No matching photos.';
    imagePickerGrid.append(empty);
  }
};

const openImagePicker = (select: HTMLSelectElement) => {
  activeImageSelect = select;
  renderImagePicker();
  imagePicker.hidden = false;
  document.body.style.overflow = 'hidden';
  imagePickerSearch.focus();
};

const enhanceImageSelect = (select: HTMLSelectElement) => {
  if (select.closest('[data-image-choice]')) {
    syncImageChoice(select);
    return;
  }

  const choice = document.createElement('div');
  choice.className = 'image-choice';
  choice.dataset.imageChoice = '';
  const preview = document.createElement('img');
  preview.className = 'image-choice-preview';
  preview.dataset.imageChoicePreview = '';
  preview.alt = '';
  const details = document.createElement('div');
  details.className = 'image-choice-details';
  const name = document.createElement('span');
  name.dataset.imageChoiceName = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choose-image-button';
  button.textContent = 'Browse photos';
  button.addEventListener('click', () => openImagePicker(select));
  details.append(name, button);
  select.classList.add('image-select-native');
  select.parentElement!.append(choice);
  choice.append(preview, details, select);
  syncImageChoice(select);
};

const fillImageSelect = (select: HTMLSelectElement, selected = '') => {
  select.replaceChildren();
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = 'Choose a photo';
  select.append(empty);

  for (const source of allAssets()) {
    const option = document.createElement('option');
    option.value = source;
    option.textContent = assetLabel(source);
    option.selected = source === selected;
    select.append(option);
  }

  if (selected && !allAssets().includes(selected)) {
    const option = document.createElement('option');
    option.value = selected;
    option.textContent = assetLabel(selected);
    option.selected = true;
    select.append(option);
  }
  enhanceImageSelect(select);
};

const refreshImageSelects = () => {
  document.querySelectorAll<HTMLSelectElement>('[data-image-select]').forEach((select) => {
    fillImageSelect(select, select.value);
  });
};

const makeInput = (labelText: string, value: string, key: string, wide = false) => {
  const label = document.createElement('label');
  if (wide) label.className = 'field-wide';
  label.textContent = labelText;
  const input = document.createElement('input');
  input.value = value || '';
  input.dataset.productField = key;
  input.required = true;
  label.append(input);
  return label;
};

const makeTextarea = (labelText: string, value: string, key: string) => {
  const label = document.createElement('label');
  label.className = 'field-wide';
  label.textContent = labelText;
  const textarea = document.createElement('textarea');
  textarea.value = value || '';
  textarea.dataset.productField = key;
  textarea.required = true;
  label.append(textarea);
  return label;
};

const makeImageSelect = (value: string, key: string) => {
  const label = document.createElement('label');
  label.className = 'field-wide';
  label.textContent = 'Photo';
  const select = document.createElement('select');
  select.dataset.productField = key;
  select.dataset.imageSelect = '';
  select.required = true;
  label.append(select);
  fillImageSelect(select, value);
  return { label, select };
};

const renderProducts = (section: 'sawmill' | 'firewood', products: Product[]) => {
  const container = document.querySelector<HTMLElement>(`[data-product-editors="${section}"]`)!;
  container.replaceChildren();

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'editor-card';
    card.dataset.productCard = '';

    const preview = document.createElement('img');
    preview.className = 'editor-card-preview';
    preview.src = displayUrl(product.image);
    preview.alt = '';

    const fields = document.createElement('div');
    fields.className = 'editor-card-fields';
    fields.append(
      makeInput('Product name', product.name, 'name'),
      makeInput('Price', product.price, 'price'),
      makeInput('Availability', product.availability, 'availability'),
      makeInput('Photo description', product.imageAlt, 'imageAlt'),
      makeTextarea('Description', product.description, 'description'),
    );

    const imageField = makeImageSelect(product.image, 'image');
    imageField.select.addEventListener('change', () => { preview.src = displayUrl(imageField.select.value); });
    fields.append(imageField.label);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-button field-wide';
    remove.textContent = 'Remove product';
    remove.addEventListener('click', () => { card.remove(); setDirty(true); });
    fields.append(remove);

    card.append(preview, fields);
    container.append(card);
  });
};

const readProducts = (section: 'sawmill' | 'firewood') => {
  const cards = document.querySelectorAll<HTMLElement>(`[data-product-editors="${section}"] [data-product-card]`);
  return [...cards].map((card) => {
    const value = (key: string) => card.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[data-product-field="${key}"]`)!.value.trim();
    return {
      name: value('name'),
      description: value('description'),
      price: value('price'),
      availability: value('availability'),
      image: value('image'),
      imageAlt: value('imageAlt'),
    };
  });
};

const renderGallery = (section: 'sawmill' | 'firewood', photos: GalleryPhoto[]) => {
  const container = document.querySelector<HTMLElement>(`[data-gallery-editors="${section}"]`)!;
  container.replaceChildren();
  photos.forEach((photo) => {
    const card = document.createElement('article');
    card.className = 'editor-card';
    card.dataset.galleryCard = '';
    const preview = document.createElement('img');
    preview.className = 'editor-card-preview';
    preview.src = displayUrl(photo.image);
    preview.alt = '';
    const fields = document.createElement('div');
    fields.className = 'editor-card-fields';
    const imageField = makeImageSelect(photo.image, 'image');
    imageField.select.dataset.galleryField = 'image';
    delete imageField.select.dataset.productField;
    imageField.select.addEventListener('change', () => { preview.src = displayUrl(imageField.select.value); });
    const alt = makeInput('Photo description', photo.alt, 'alt', true);
    const altInput = alt.querySelector('input')!;
    altInput.dataset.galleryField = 'alt';
    delete altInput.dataset.productField;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-button field-wide';
    remove.textContent = 'Remove photo';
    remove.addEventListener('click', () => { card.remove(); setDirty(true); });
    fields.append(imageField.label, alt, remove);
    card.append(preview, fields);
    container.append(card);
  });
};

const readGallery = (section: 'sawmill' | 'firewood') => [...document.querySelectorAll<HTMLElement>(`[data-gallery-editors="${section}"] [data-gallery-card]`)].map((card) => ({
  image: card.querySelector<HTMLSelectElement>('[data-gallery-field="image"]')!.value,
  alt: card.querySelector<HTMLInputElement>('[data-gallery-field="alt"]')!.value.trim(),
}));

const populateEditor = () => {
  const business = content.business;
  const sawmill = content.sawmill;
  const firewood = content.firewood;
  for (const key of ['companyName', 'owner', 'phone', 'location', 'address', 'serviceArea', 'hours']) setField(`business.${key}`, business[key]);
  for (const key of ['headline', 'intro', 'heroImageAlt']) setField(`sawmill.${key}`, sawmill[key]);
  for (const key of ['headline', 'intro', 'phone', 'notice', 'heroImageAlt', 'pickup', 'delivery']) setField(`firewood.${key}`, firewood[key]);
  fillImageSelect(field('sawmill.heroImage') as HTMLSelectElement, sawmill.heroImage);
  fillImageSelect(field('firewood.heroImage') as HTMLSelectElement, firewood.heroImage);
  renderProducts('sawmill', sawmill.products || []);
  renderProducts('firewood', firewood.products || []);
  renderGallery('sawmill', sawmill.gallery || []);
  renderGallery('firewood', firewood.gallery || []);
  renderAssetGrid();
  setDirty(false);
};

const collectContent = () => ({
  business: {
    companyName: getField('business.companyName'),
    owner: getField('business.owner'),
    phone: getField('business.phone'),
    location: getField('business.location'),
    address: getField('business.address'),
    serviceArea: getField('business.serviceArea'),
    hours: getField('business.hours'),
  },
  sawmill: {
    headline: getField('sawmill.headline'),
    intro: getField('sawmill.intro'),
    heroImage: getField('sawmill.heroImage'),
    heroImageAlt: getField('sawmill.heroImageAlt'),
    products: readProducts('sawmill'),
    gallery: readGallery('sawmill'),
  },
  firewood: {
    headline: getField('firewood.headline'),
    intro: getField('firewood.intro'),
    heroImage: getField('firewood.heroImage'),
    heroImageAlt: getField('firewood.heroImageAlt'),
    phone: getField('firewood.phone'),
    notice: getField('firewood.notice'),
    products: readProducts('firewood'),
    pickup: getField('firewood.pickup'),
    delivery: getField('firewood.delivery'),
    gallery: readGallery('firewood'),
  },
});

const renderAssetGrid = () => {
  const grid = document.querySelector<HTMLElement>('[data-asset-grid]')!;
  grid.replaceChildren();
  for (const source of allAssets()) {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = displayUrl(source);
    image.alt = '';
    image.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = assetLabel(source);
    caption.title = source;
    figure.append(image, caption);
    grid.append(figure);
  }
};

const loadRemoteAssets = async () => {
  if (!supabase) return;
  const { data, error } = await supabase.storage.from('site-images').list('uploads', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return;
  remoteAssets = (data || []).filter((item) => item.name && item.id).map((item) => (
    supabase.storage.from('site-images').getPublicUrl(`uploads/${item.name}`).data.publicUrl
  ));
};

const loadContent = async () => {
  if (!supabase) return;
  const { data, error } = await supabase.from('site_content').select('id, value');
  if (error) throw error;
  for (const row of data || []) content[row.id] = { ...content[row.id], ...row.value };
};

const showEditor = async () => {
  loginPanel.hidden = true;
  editor.hidden = false;
  saveMessage.textContent = 'Loading content…';
  try {
    await Promise.all([loadContent(), loadRemoteAssets()]);
    populateEditor();
    saveMessage.textContent = '';
  } catch {
    saveMessage.textContent = 'The editor could not load the saved content.';
  }
};

const optimizeImage = async (file: File) => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image processing is unavailable.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
  if (!blob) throw new Error('The image could not be prepared.');
  return blob;
};

const uploadFiles = async (files: FileList) => {
  if (!supabase) return;
  uploadMessage.textContent = `Uploading ${files.length} photo${files.length === 1 ? '' : 's'}…`;
  let uploaded = 0;
  for (const file of [...files]) {
    try {
      const blob = await optimizeImage(file);
      const safeName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';
      const path = `uploads/${Date.now()}-${safeName}.webp`;
      const { error } = await supabase.storage.from('site-images').upload(path, blob, { contentType: 'image/webp', upsert: false });
      if (error) throw error;
      remoteAssets.unshift(supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl);
      uploaded += 1;
    } catch {
      uploadMessage.textContent = `Uploaded ${uploaded} of ${files.length}. One photo could not be uploaded.`;
      renderAssetGrid();
      refreshImageSelects();
      return;
    }
  }
  uploadMessage.textContent = `${uploaded} photo${uploaded === 1 ? '' : 's'} uploaded.`;
  renderAssetGrid();
  refreshImageSelects();
};

document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.tab;
    document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((item) => item.removeAttribute('aria-current'));
    button.setAttribute('aria-current', 'page');
    document.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== selected; });
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-add-product]').forEach((button) => {
  button.addEventListener('click', () => {
    const section = button.dataset.addProduct as 'sawmill' | 'firewood';
    const products = readProducts(section);
    products.push({ name: 'New product', description: '', price: 'Call for pricing', availability: 'Available', image: '', imageAlt: '' });
    renderProducts(section, products);
    setDirty(true);
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-add-gallery]').forEach((button) => {
  button.addEventListener('click', () => {
    const section = button.dataset.addGallery as 'sawmill' | 'firewood';
    const gallery = readGallery(section);
    gallery.push({ image: '', alt: '' });
    renderGallery(section, gallery);
    setDirty(true);
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-close-image-picker]').forEach((button) => {
  button.addEventListener('click', closeImagePicker);
});

imagePickerSearch.addEventListener('input', () => renderImagePicker(imagePickerSearch.value));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !imagePicker.hidden) closeImagePicker();
});

contentForm.addEventListener('input', () => setDirty(true));
contentForm.addEventListener('change', () => setDirty(true));

contentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase || !contentForm.reportValidity()) return;
  const button = contentForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.disabled = true;
  saveMessage.textContent = 'Saving…';
  const nextContent = collectContent();
  const rows = Object.entries(nextContent).map(([id, value]) => ({ id, value, updated_at: new Date().toISOString() }));
  const { error } = await supabase.from('site_content').upsert(rows);
  button.disabled = false;
  if (error) {
    saveMessage.textContent = 'Changes could not be saved. Please try again.';
    return;
  }
  content = nextContent;
  saveMessage.textContent = 'Changes saved.';
  setDirty(false);
});

document.querySelector<HTMLInputElement>('[data-photo-upload]')!.addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  if (input.files?.length) await uploadFiles(input.files);
  input.value = '';
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) return;
  const password = new FormData(loginForm).get('password')?.toString() || '';
  const button = loginForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.disabled = true;
  loginMessage.textContent = 'Signing in…';
  const { error } = await supabase.auth.signInWithPassword({ email: config.adminEmail, password });
  button.disabled = false;
  if (error) {
    loginMessage.textContent = 'That password did not work.';
    return;
  }
  loginForm.reset();
  loginMessage.textContent = '';
  await showEditor();
});

document.querySelector<HTMLButtonElement>('[data-logout]')!.addEventListener('click', async () => {
  if (supabase) await supabase.auth.signOut();
  editor.hidden = true;
  loginPanel.hidden = false;
});

window.addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
});

if (!isConfigured) {
  loginForm.hidden = true;
  connectionMessage.hidden = false;
} else {
  const { data } = await supabase!.auth.getSession();
  if (data.session) await showEditor();
}
