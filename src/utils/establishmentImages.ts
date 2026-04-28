type EstablishmentImageLike = {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  imagePaths?: string[] | null;
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
    establishment.imageUrl,
  ]);
}

export function getPrimaryEstablishmentImageUrl(
  establishment: EstablishmentImageLike | null | undefined,
) {
  return getEstablishmentImageUrls(establishment)[0] ?? null;
}

export function getEstablishmentImagePaths(establishment: EstablishmentImageLike | null | undefined) {
  if (!establishment) {
    return [];
  }

  return sanitizeUrls([
    ...(Array.isArray(establishment.imagePaths) ? establishment.imagePaths : []),
  ]);
}
