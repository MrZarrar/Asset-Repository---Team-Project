// Helper functions for image handling
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