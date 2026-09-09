import Image from "next/image";

const SIZE_MAP = {
  sm: 40,
  md: 72,
  lg: 120,
  xl: 180,
} as const;

/**
 * The one and only place the XAS badge artwork is referenced from. Always
 * points at /public/xas-badge.png (the official supplied logo) — never
 * generate or substitute a different mark here.
 */
export function XasBadge({
  size = "md",
  priority = false,
  className = "",
}: {
  size?: keyof typeof SIZE_MAP;
  priority?: boolean;
  className?: string;
}) {
  const px = SIZE_MAP[size];
  return (
    <Image
      src="/xas-badge.png"
      alt="XTREAM ADVANCED SCHOLARS"
      width={px}
      height={px}
      priority={priority}
      className={className}
    />
  );
}
