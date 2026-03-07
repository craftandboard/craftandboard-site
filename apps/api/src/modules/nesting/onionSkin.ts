import { areaSqIn } from "./geometry.js";

export function requiresOnionSkin(widthIn: number, depthIn: number) {
  return areaSqIn(widthIn, depthIn) <= 144;
}
