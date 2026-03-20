import type { Metadata } from "next";

export function getGoogleSiteVerificationToken() {
  return process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;
}

export function getSiteVerificationMetadata(): Pick<Metadata, "verification"> {
  const google = getGoogleSiteVerificationToken();

  return {
    verification: google
      ? {
          google
        }
      : undefined
  };
}
