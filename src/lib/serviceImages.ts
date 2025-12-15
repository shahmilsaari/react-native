export type ServiceImageSource = {
  name?: string;
  images?: string[];
};

const FALLBACK_IMAGES: Array<{ match: RegExp; url: string }> = [
  {
    match: /photo\s*booth/i,
    url: 'https://images.unsplash.com/photo-1529694157877-6f8bfc48757f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    match: /video(graphy)?|videographer/i,
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'
  },
  {
    match: /photo(graphy)?|photographer/i,
    url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80'
  }
];

const normalizePlaceholderCoUrl = (rawUrl: string) => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname !== 'placehold.co') {
      return rawUrl;
    }
    const text = parsed.searchParams.get('text');
    if (!text) {
      return rawUrl;
    }
    parsed.searchParams.set('text', text);
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

const safeImageUrl = (rawUrl?: string) => {
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  return normalizePlaceholderCoUrl(trimmed);
};

export const getServiceImages = (service: ServiceImageSource) => {
  const images = (service.images ?? []).map(safeImageUrl).filter(Boolean) as string[];
  const name = service.name ?? '';
  const fallback = FALLBACK_IMAGES.find((item) => item.match.test(name))?.url;

  const shouldPreferFallback =
    images.length > 0 &&
    (() => {
      try {
        return new URL(images[0]).hostname === 'placehold.co';
      } catch {
        return false;
      }
    })() &&
    Boolean(fallback);

  if (shouldPreferFallback) {
    return [fallback!];
  }

  if (images.length) {
    return images;
  }

  return fallback ? [fallback] : [];
};

export const getServiceHeroImage = (service: ServiceImageSource) => getServiceImages(service)[0];

