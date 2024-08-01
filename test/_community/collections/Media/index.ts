import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  upload: {
    mimeTypes: ['image/png', 'image/webp', 'image/jpeg'],
    imageSizes: [],
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [],
}
