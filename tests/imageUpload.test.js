import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageFile,
  validateMultipleImageFiles,
  formatFileSize,
  sanitizeFilename,
  MAX_FILE_SIZE_BYTES
} from '../src/lib/imageUpload.js';

describe('image upload & validation utility', () => {
  test('formats file size in human-readable units', () => {
    assert.equal(formatFileSize(0), '0 B');
    assert.equal(formatFileSize(1024), '1 KB');
    assert.equal(formatFileSize(1.5 * 1024 * 1024), '1.5 MB');
    assert.equal(formatFileSize(5 * 1024 * 1024), '5 MB');
  });

  test('sanitizes filename safely', () => {
    assert.equal(sanitizeFilename('My Pet Photo! #1.PNG'), 'my-pet-photo-1.png');
    assert.equal(sanitizeFilename('../../../dangerous.webp'), 'dangerous.webp');
  });

  test('accepts valid JPEG, PNG, and WEBP files under 5MB', () => {
    const validJpeg = { name: 'dog.jpg', type: 'image/jpeg', size: 1024 * 1024 };
    const validPng = { name: 'cat.png', type: 'image/png', size: 2 * 1024 * 1024 };
    const validWebp = { name: 'treat.webp', type: 'image/webp', size: 500 * 1024 };

    assert.equal(validateImageFile(validJpeg).valid, true);
    assert.equal(validateImageFile(validPng).valid, true);
    assert.equal(validateImageFile(validWebp).valid, true);
  });

  test('rejects files exceeding 5MB limit', () => {
    const oversizedFile = {
      name: 'huge_photo.png',
      type: 'image/png',
      size: MAX_FILE_SIZE_BYTES + 1024 // > 5MB
    };

    const res = validateImageFile(oversizedFile);
    assert.equal(res.valid, false);
    assert.match(res.error, /File is too large/);
    assert.match(res.error, /Maximum allowed size is 5 MB/);
  });

  test('rejects empty files (0 bytes)', () => {
    const emptyFile = { name: 'empty.jpg', type: 'image/jpeg', size: 0 };
    const res = validateImageFile(emptyFile);
    assert.equal(res.valid, false);
    assert.match(res.error, /File is empty/);
  });

  test('rejects disallowed MIME types (GIF, SVG, PDF, HTML)', () => {
    const gifFile = { name: 'anim.gif', type: 'image/gif', size: 1024 };
    const svgFile = { name: 'vector.svg', type: 'image/svg+xml', size: 1024 };
    const pdfFile = { name: 'doc.pdf', type: 'application/pdf', size: 1024 };

    assert.equal(validateImageFile(gifFile).valid, false);
    assert.match(validateImageFile(gifFile).error, /Invalid file type/);

    assert.equal(validateImageFile(svgFile).valid, false);
    assert.match(validateImageFile(svgFile).error, /Invalid file type/);

    assert.equal(validateImageFile(pdfFile).valid, false);
    assert.match(validateImageFile(pdfFile).error, /Invalid file type/);
  });

  test('rejects mismatched or unsupported file extensions', () => {
    const badExt = { name: 'photo.exe', type: 'image/jpeg', size: 1024 };
    const noExt = { name: 'photofile', type: 'image/jpeg', size: 1024 };

    assert.equal(validateImageFile(badExt).valid, false);
    assert.match(validateImageFile(badExt).error, /not supported/);

    assert.equal(validateImageFile(noExt).valid, false);
    assert.match(validateImageFile(noExt).error, /valid image extension/);
  });

  test('validates up to 3 image files and rejects >3 or invalid items', () => {
    const valid1 = { name: 'angle1.jpg', type: 'image/jpeg', size: 1024 * 500 };
    const valid2 = { name: 'angle2.png', type: 'image/png', size: 1024 * 800 };
    const valid3 = { name: 'angle3.webp', type: 'image/webp', size: 1024 * 300 };
    const valid4 = { name: 'angle4.jpg', type: 'image/jpeg', size: 1024 * 400 };

    // Valid 1 to 3 items
    assert.equal(validateMultipleImageFiles([valid1]).valid, true);
    assert.equal(validateMultipleImageFiles([valid1, valid2]).valid, true);
    assert.equal(validateMultipleImageFiles([valid1, valid2, valid3]).valid, true);

    // Rejects > 3
    const overLimit = validateMultipleImageFiles([valid1, valid2, valid3, valid4]);
    assert.equal(overLimit.valid, false);
    assert.match(overLimit.error, /at most 3 images/);

    // Rejects if any file within the 3 is invalid
    const invalidItem = { name: 'bad.gif', type: 'image/gif', size: 1024 };
    const withBad = validateMultipleImageFiles([valid1, invalidItem, valid3]);
    assert.equal(withBad.valid, false);
    assert.match(withBad.error, /File 2/);
  });
});
