import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getSiteConfig } from "@/lib/site-config";
import { publicVariantCookieName } from "@/lib/public-variant-cookies";
import { buildRenderModel, materializeSiteConfig, resolveLocaleFromAcceptLanguage, resolvePublicVariantId } from "@/lib/utils";
import { SiteLayout } from "@/components/site/SiteLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig();
  const siteUrl = config.settings.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const metadataBase = getMetadataBase(siteUrl);
  const title = config.settings.seoTitle || config.settings.siteTitle;
  const description = config.settings.seoDescription || config.settings.siteDescription;
  const canonicalUrl = config.settings.seoCanonicalUrl || siteUrl;

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      type: "website",
      images: config.settings.seoOgImage ? [config.settings.seoOgImage] : undefined
    }
  };
}

export default async function HomePage() {
  const config = await getPublicSiteConfig();
  const model = buildRenderModel(config);
  return <SiteLayout config={config} renderModel={model} />;
}

async function getPublicSiteConfig() {
  const config = await getSiteConfig();
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const variantId = resolvePublicVariantId(config, cookieStore.get(publicVariantCookieName)?.value);
  const locale = resolveLocaleFromAcceptLanguage(config, requestHeaders.get("accept-language"));
  return materializeSiteConfig(config, variantId, locale);
}

function getMetadataBase(siteUrl: string) {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  }
}
