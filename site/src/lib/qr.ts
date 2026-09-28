import QRCode from "qrcode";

/** PNG buffer for a permanent catalogue / brochure link */
export async function qrPngBuffer(absoluteUrl: string, size = 512): Promise<Buffer> {
  return QRCode.toBuffer(absoluteUrl, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

/** Data URL for admin preview */
export async function qrDataUrl(absoluteUrl: string, size = 240): Promise<string> {
  return QRCode.toDataURL(absoluteUrl, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
