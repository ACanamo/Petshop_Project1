/**
 * PETCHUP — PRODUCT IMAGE UPLOAD & VALIDATION UTILITY
 *
 * Enforces strict MIME-type & extension validation, file size limits (max 5MB),
 * metadata extraction (dimensions, formatted size), and uploads directly to
 * Supabase Storage ('product-images' bucket).
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Format bytes into human-readable size (e.g. 1.4 MB, 850 KB)
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

/**
 * Validates a file before upload
 * @param {File|Blob} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeStr = formatFileSize(file.size);
    const maxStr = formatFileSize(MAX_FILE_SIZE_BYTES);
    return {
      valid: false,
      error: `File is too large (${sizeStr}). Maximum allowed size is ${maxStr}.`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  // Check MIME type
  const mimeType = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'
    };
  }

  // Check file extension if name is available
  if (file.name) {
    const lastDotIndex = file.name.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return {
        valid: false,
        error: 'File must have a valid image extension (.jpg, .jpeg, .png, .webp).'
      };
    }
    const ext = file.name.slice(lastDotIndex).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Extension "${ext}" is not supported. Please upload a .jpg, .png, or .webp image.`
      };
    }
  }

  return { valid: true };
}

/**
 * Reads the width and height of an image asynchronously for live verification
 * @param {File|Blob} file 
 * @returns {Promise<{ width: number, height: number }>}
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.URL) {
      resolve({ width: 0, height: 0 });
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: 0, height: 0 });
      };
      img.src = objectUrl;
    } catch (_) {
      resolve({ width: 0, height: 0 });
    }
  });
}

/**
 * Sanitizes a filename to prevent path traversal or special character issues
 */
export function sanitizeFilename(filename) {
  const rawBase = (filename || 'product-image.webp').split(/[/\\]/).pop();
  return rawBase
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Uploads a validated image file to Supabase Storage 'product-images' bucket.
 * @param {File|Blob} file
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export async function uploadProductImage(file, supabaseClient) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!supabaseClient || !supabaseClient.storage) {
    throw new Error('Supabase client is not configured.');
  }

  const cleanName = sanitizeFilename(file.name || `image_${Date.now()}.webp`);
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const filePath = `products/${uniquePrefix}_${cleanName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 year cache
      upsert: true,
      contentType: file.type || 'image/webp'
    });

  if (uploadError) {
    throw new Error(`Failed to upload image to Supabase: ${uploadError.message}`);
  }

  const { data: publicData } = supabaseClient.storage
    .from('product-images')
    .getPublicUrl(filePath);

  if (!publicData?.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded image.');
  }

  return publicData.publicUrl;
}

/**
 * Validates an array or FileList of image files for multi-upload
 * @param {Array<File|Blob>|FileList} files
 * @param {number} maxFiles
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMultipleImageFiles(files, maxFiles = 3) {
  const fileArray = Array.from(files || []);
  if (fileArray.length === 0) {
    return { valid: false, error: 'No files selected.' };
  }
  if (fileArray.length > maxFiles) {
    return { valid: false, error: `You can upload at most ${maxFiles} images per product.` };
  }

  for (let i = 0; i < fileArray.length; i++) {
    const res = validateImageFile(fileArray[i]);
    if (!res.valid) {
      return {
        valid: false,
        error: `File ${i + 1} (${fileArray[i].name || 'unnamed'}): ${res.error}`
      };
    }
  }

  return { valid: true };
}
