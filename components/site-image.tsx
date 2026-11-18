import Image, { type ImageProps } from "next/image";
import enhancements from "@/data/image-enhancements.json";

/** Routes editorial photos to reviewed restoration variants; originals stay intact. */
export function SiteImage({
  src,
  alt,
  sizes = "(min-width: 1440px) 660px, (min-width: 768px) 50vw, 100vw",
  ...props
}: Omit<ImageProps, "src"> & { src: string }) {
  const restored = enhancements[src as keyof typeof enhancements] || src;
  return <Image {...props} alt={alt} src={restored} sizes={sizes} quality={85} />;
}
