/**
 * @fileoverview Utility functions for handling images and file type detection.
 * @module lib/imageUtils
 */

/**
 * Generates a URL for an asset image with the specified size.
 * If the asset doesn't exist or doesn't have a file, returns a placeholder image.
 * 
 * @function getImageUrl
 * @param {Object} asset - The asset object containing id and file properties
 * @param {string} [size='thumb'] - The desired image size ('thumb', 'medium', 'large', or 'original')
 * @returns {string} The URL for the image with the specified size
 */
export function getImageUrl(asset, size = 'thumb') {
  if (!asset || !asset.file) return '/placeholder.png';
  
  // PocketBase serves multiple image sizes with special query parameters
  const baseUrl = `http://127.0.0.1:8090/api/files/assets/${asset.id}/${asset.file}`;
  
  switch (size) {
    case 'thumb':
      return `${baseUrl}?thumb=100x100`;
    case 'medium':
      return `${baseUrl}?thumb=300x300`;
    case 'large':
      return `${baseUrl}?thumb=600x600`;
    default:
      return baseUrl;
  }
}

/**
 * Determines the appropriate icon to display based on the file type of an asset.
 * 
 * @function getFileTypeIcon
 * @param {Object} asset - The asset object containing file property
 * @returns {string} The name of the icon to use for the file type
 */
export function getFileTypeIcon(asset) {
  if (!asset || !asset.file) return 'file';
  
  const extension = asset.file.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    case 'ppt':
    case 'pptx':
      return 'powerpoint';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'image';
    case 'mp4':
    case 'webm':
    case 'avi':
      return 'video';
    default:
      return 'file';
  }
} 