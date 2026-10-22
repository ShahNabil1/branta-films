import { useState, type ImgHTMLAttributes } from "react";
import { IMAGE_WIDTHS, mediaUrl, transformedMediaUrl, type ImageVariant } from "@/lib/media";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  path: string;
  variant: ImageVariant;
};

/** Responsive CDN artwork; retain the original if the zone or source is unavailable. */
export function ArtworkImage({ path, variant, sizes, onError, ...props }: Props) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const widths = IMAGE_WIDTHS[variant];
  const transformed = failedPath !== path ? transformedMediaUrl(path, widths[1]) : null;
  return <img {...props}
    src={transformed ?? mediaUrl(path) ?? undefined}
    srcSet={transformed ? widths.map(width => `${transformedMediaUrl(path, width)} ${width}w`).join(", ") : undefined}
    sizes={transformed ? sizes : undefined}
    onError={event => {
      if (transformed) setFailedPath(path);
      else onError?.(event);
    }}
  />;
}