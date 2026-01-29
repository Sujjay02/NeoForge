import LZString from 'lz-string';

interface SharePayload {
  code: string;
  explanation: string;
}

/**
 * Encode code and explanation into a shareable URL
 */
export function encodeShareUrl(code: string, explanation: string): string {
  const payload: SharePayload = { code, explanation };
  const json = JSON.stringify(payload);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${window.location.origin}${window.location.pathname}?share=${compressed}`;
}

/**
 * Decode a share URL back into code and explanation
 */
export function decodeShareUrl(url: string): SharePayload | null {
  try {
    const urlObj = new URL(url);
    const share = urlObj.searchParams.get('share');
    if (!share) return null;

    const decompressed = LZString.decompressFromEncodedURIComponent(share);
    if (!decompressed) return null;

    const payload = JSON.parse(decompressed) as SharePayload;
    return payload;
  } catch (e) {
    console.error('Failed to decode share URL:', e);
    return null;
  }
}

/**
 * Check if current URL has a share parameter
 */
export function hasShareParameter(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('share');
}

/**
 * Clear share parameter from URL without reloading
 */
export function clearShareParameter(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.pathname);
}

/**
 * Get estimated URL length for the given payload
 */
export function getEstimatedUrlLength(code: string, explanation: string): number {
  const payload: SharePayload = { code, explanation };
  const json = JSON.stringify(payload);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return window.location.origin.length + window.location.pathname.length + 7 + compressed.length; // 7 = ?share=
}
