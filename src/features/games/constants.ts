export { MAX_CATEGORIES, MIN_CATEGORIES } from '@/features/match/engine'

export const MIN_QUESTIONS_TO_PUBLISH = 5
export const MAX_QUESTIONS_PER_CATEGORY = 100
export const MAX_TITLE_LENGTH = 60
export const MAX_CATEGORY_NAME_LENGTH = 24
export const MAX_QUESTION_LENGTH = 200
export const MAX_OPTION_LENGTH = 80

export const MAX_IMAGE_BYTES = 1_000_000
export const IMAGE_MAX_SIDE = 512
/** Question pictures need more detail than a category avatar. */
export const QUESTION_IMAGE_MAX_SIDE = 1024
export const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']
