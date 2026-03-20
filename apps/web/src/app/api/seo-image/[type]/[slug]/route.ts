import React from "react";
import { ImageResponse } from "next/og";
import { getSeoSocialImageTheme, resolveSeoSocialImageByRoute, type SeoSocialImageRouteType } from "../../../../../lib/seo/socialImages";

export const runtime = "edge";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

function sanitizeType(value: string): SeoSocialImageRouteType | null {
  if (
    value === "home" ||
    value === "category" ||
    value === "product" ||
    value === "variant" ||
    value === "guide" ||
    value === "guide-index" ||
    value === "static"
  ) {
    return value;
  }

  return null;
}

function formatConfig(format: string | null) {
  if (format === "pinterest") {
    return {
      width: 1000,
      height: 1500,
      titleSize: 72,
      descriptionSize: 34,
      footerSize: 30,
      isPinterest: true
    };
  }

  return {
    width: 1200,
    height: 630,
    titleSize: 56,
    descriptionSize: 24,
    footerSize: 22,
    isPinterest: false
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string; slug: string }> }
) {
  const params = await context.params;
  const type = sanitizeType(params.type);

  if (!type) {
    return new Response("Not found", { status: 404 });
  }

  const payload = resolveSeoSocialImageByRoute({
    type,
    slug: params.slug
  });

  if (!payload) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const format = formatConfig(url.searchParams.get("format"));
  const theme = getSeoSocialImageTheme(payload.productFamily);
  const e = React.createElement;

  return new ImageResponse(
    e(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(145deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
          color: "#1f140f"
        }
      },
      e("div", {
        style: {
          position: "absolute",
          inset: 24,
          borderRadius: 40,
          border: "1px solid rgba(255,255,255,0.18)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)"
        }
      }),
      e(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: format.isPinterest ? "56px" : "40px"
          }
        },
        e(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }
          },
          e(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 16
              }
            },
            e("div", {
              style: {
                display: "flex",
                width: format.isPinterest ? 44 : 32,
                height: format.isPinterest ? 44 : 32,
                borderRadius: 999,
                background: "#f7efe6"
              }
            }),
            e(
              "div",
              {
                style: {
                  display: "flex",
                  color: "#f7efe6",
                  fontSize: format.isPinterest ? 30 : 22,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontWeight: 700
                }
              },
              "Craft & Board"
            )
          ),
          e(
            "div",
            {
              style: {
                display: "flex",
                borderRadius: 999,
                background: "rgba(247,239,230,0.16)",
                color: "#f7efe6",
                padding: format.isPinterest ? "14px 24px" : "10px 18px",
                fontSize: format.isPinterest ? 24 : 18,
                textTransform: "uppercase",
                letterSpacing: "0.16em"
              }
            },
            format.isPinterest ? "Pinterest Pin" : "Share Preview"
          )
        ),
        e(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: format.isPinterest ? 28 : 18,
              marginTop: format.isPinterest ? 36 : 18
            }
          },
          e(
            "div",
            {
              style: {
                display: "flex",
                alignSelf: "flex-start",
                borderRadius: 999,
                background: theme.accentBackground,
                color: theme.accentText,
                padding: format.isPinterest ? "14px 24px" : "10px 18px",
                fontSize: format.isPinterest ? 24 : 18,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700
              }
            },
            payload.accentLabel
          ),
          e(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: format.isPinterest ? 22 : 14,
                borderRadius: 36,
                background: theme.cardBackground,
                padding: format.isPinterest ? "40px" : "30px",
                maxWidth: format.isPinterest ? "100%" : "82%"
              }
            },
            e(
              "div",
              {
                style: {
                  display: "flex",
                  fontSize: format.titleSize,
                  lineHeight: 1.05,
                  fontWeight: 700
                }
              },
              payload.title
            ),
            e(
              "div",
              {
                style: {
                  display: "flex",
                  fontSize: format.descriptionSize,
                  lineHeight: 1.35,
                  color: "#5b4639"
                }
              },
              payload.keywordHint ?? payload.supportingLabel
            )
          )
        ),
        e(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: format.isPinterest ? "column" : "row",
              justifyContent: "space-between",
              gap: format.isPinterest ? 20 : 16,
              alignItems: format.isPinterest ? "flex-start" : "flex-end"
            }
          },
          e(
            "div",
            {
              style: {
                display: "flex",
                maxWidth: format.isPinterest ? "100%" : "70%",
                color: "#f7efe6",
                fontSize: format.footerSize,
                lineHeight: 1.35
              }
            },
            payload.description
          ),
          e(
            "div",
            {
              style: {
                display: "flex",
                alignSelf: format.isPinterest ? "stretch" : "auto",
                borderRadius: 999,
                background: "#1f140f",
                color: "#f7efe6",
                padding: format.isPinterest ? "18px 26px" : "14px 20px",
                fontSize: format.isPinterest ? 26 : 18,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }
            },
            payload.pageType === "GUIDE_ARTICLE" ? "Read the Guide" : "Explore the Page"
          )
        )
      )
    ),
    {
      width: format.width,
      height: format.height,
      headers: {
        "Cache-Control": CACHE_CONTROL
      }
    }
  );
}
