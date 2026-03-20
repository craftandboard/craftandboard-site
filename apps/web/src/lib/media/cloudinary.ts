import { storefrontConfig } from "../storefront/config";

type CloudinaryOptions = {
  width?: number;
  height?: number;
  quality?: number | "auto";
  fit?: "fill" | "fit" | "crop" | "pad";
};

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function getCloudinaryImageUrl(
  publicId: string | null | undefined,
  options: CloudinaryOptions = {}
) {
  if (!publicId) {
    return storefrontConfig.placeholderImage;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return storefrontConfig.placeholderImage;
  }

  const folder = trimSlashes(process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "");
  const safePublicId = trimSlashes(publicId);
  const assetPath = folder ? `${folder}/${safePublicId}` : safePublicId;
  const transformations = [
    options.fit ? `c_${options.fit}` : "c_fill",
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
    `q_${options.quality ?? "auto"}`,
    "f_auto"
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${assetPath}`;
}
