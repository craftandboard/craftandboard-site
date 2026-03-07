import bwipjs from "bwip-js";
import { logger } from "../../lib/logger.js";

export async function renderOrderBarcodeSvg(value: string): Promise<string> {
  try {
    return bwipjs.toSVG({
      bcid: "code128",
      text: value,
      scale: 2,
      height: 8,
      includetext: false,
      textxalign: "center",
      backgroundcolor: "FFFFFF"
    });
  } catch (error) {
    logger.error("Barcode rendering failed", error);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48" viewBox="0 0 240 48"><rect width="240" height="48" fill="#fff"/><text x="12" y="28" font-size="14" font-family="Arial, sans-serif" fill="#111">${value}</text></svg>`;
  }
}
