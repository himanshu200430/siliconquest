/**
 * Utility to determine if a string is a valid image URL
 * @param url - The string to check
 * @returns true if it's a valid image URL, false otherwise
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim();
  
  // Empty string
  if (trimmedUrl.length === 0) return false;
  
  // Check if it's a valid URL format (http/https or relative path starting with /)
  const isUrl = trimmedUrl.startsWith('http://') || 
                trimmedUrl.startsWith('https://') || 
                trimmedUrl.startsWith('/');
  
  if (!isUrl) return false;
  
  // Check if it has a valid image extension
  const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(trimmedUrl);
  
  return hasImageExtension;
}

/**
 * Get the image source path for a character image
 * @param image - The image field from Firestore
 * @returns The image URL to use in src attribute
 */
export function getImageSrc(image: string | undefined | null): string | null {
  if (!image) return null;
  
  const trimmedImage = image.trim();
  
  if (!isValidImageUrl(trimmedImage)) return null;
  
  // If it's a full URL (starts with http), use it as-is
  if (trimmedImage.startsWith('http://') || trimmedImage.startsWith('https://')) {
    return trimmedImage;
  }
  
  // If it's a relative path starting with /, use it as-is
  if (trimmedImage.startsWith('/')) {
    return trimmedImage;
  }
  
  return null;
}

/**
 * Check if the image field should be displayed as text/emoji
 * @param image - The image field from Firestore
 * @returns true if it should be displayed as text, false if it's an image URL
 */
export function shouldDisplayAsText(image: string | undefined | null): boolean {
  if (!image) return false;
  
  const trimmedImage = image.trim();
  
  // If it's empty, don't display as text
  if (trimmedImage.length === 0) return false;
  
  // If it's a valid image URL, don't display as text
  if (isValidImageUrl(trimmedImage)) return false;
  
  // Otherwise, it should be displayed as text (emoji, character name, etc.)
  return true;
}
