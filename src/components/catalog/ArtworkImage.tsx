import { useState, type ImgHTMLAttributes } from "react";
import { artworkSources, mediaUrl, type ImageVariant } from "@/lib/media";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  path: string;
  variant: ImageVariant;
};

/** Responsive CDN artwork; retain the original if the zone or source is unavailable. */
export function ArtworkImage({ path, variant, sizes, onError, ...props }: Props) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const source = artworkSources(path, variant);
  const transformed = failedPath !== path && Boolean(source.srcSet);
  return <img {...props}
    src={transformed ? source.src : mediaUrl(path) ?? undefined}
    srcSet={transformed ? source.srcSet : undefined}
    sizes={transformed ? sizes : undefined}
    onError={event => {
      if (transformed) setFailedPath(path);
      else onError?.(event);
    }}
  />;
}