type EstablishmentImageLike = {
  imagem_url?: string | null;
  img?: string | null;
  imageUrl?: string | null;
  imagem_urls?: string[] | null;
  imageUrls?: string[] | null;
};

function sanitizeUrls(urls: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      urls
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  );
}

export function getEstablishmentImageUrls(establishment: EstablishmentImageLike | null | undefined) {
  if (!establishment) {
    return [];
  }

  return sanitizeUrls([
    ...(Array.isArray(establishment.imageUrls) ? establishment.imageUrls : []),
    ...(Array.isArray(establishment.imagem_urls) ? establishment.imagem_urls : []),
    establishment.imageUrl,
    establishment.imagem_url,
    establishment.img,
  ]);
}

export function getPrimaryEstablishmentImageUrl(
  establishment: EstablishmentImageLike | null | undefined,
) {
  return getEstablishmentImageUrls(establishment)[0] ?? null;
}
