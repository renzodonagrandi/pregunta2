import Image from 'next/image'

interface CategoryAvatarProps {
  name: string
  color: string
  imageUrl: string | null
  /** Rendered size in px. */
  size: number
  /** Shows the category as not owned. */
  muted?: boolean
  className?: string
}

/** Category image, or its initial over its color when it has no image. */
export function CategoryAvatar({
  name,
  color,
  imageUrl,
  size,
  muted = false,
  className = '',
}: CategoryAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white ring-2 ring-white ${muted ? 'opacity-40 grayscale' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.45,
      }}
      title={name}
    >
      {imageUrl ? (
        // Images are already compressed to ~512px WebP on upload.
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          unoptimized
          className='object-cover'
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  )
}
