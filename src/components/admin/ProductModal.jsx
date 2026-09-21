import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import {
  validateImageFile,
  formatFileSize,
  getImageDimensions,
  uploadProductImage,
  MAX_FILE_SIZE_BYTES
} from '../../lib/imageUpload';
import { XIcon } from '@phosphor-icons/react';

export default function ProductModal({ isOpen, onClose, onSave, initialProduct }) {
  const { showToast } = useCart();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('feeds');
  const [pet, setPet] = useState('all');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState(25);
  const [badge, setBadge] = useState('');
  const [img, setImg] = useState('🐾');
  const [images, setImages] = useState(['']);
  const [desc, setDesc] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');

  // Image upload & verification states
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [stagedFile, setStagedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileMeta, setFileMeta] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setSku(initialProduct.sku || '');
      setCategory(initialProduct.category || 'feeds');
      setPet(initialProduct.pet || 'all');
      setPrice(initialProduct.price || '');
      setOriginalPrice(initialProduct.originalPrice || '');
      setStockQuantity(initialProduct.stockQuantity ?? 25);
      setBadge(initialProduct.badge || '');
      setImg(initialProduct.img || '🐾');
      const initialImages = Array.isArray(initialProduct.images) && initialProduct.images.length > 0
        ? initialProduct.images
        : (initialProduct.imageUrl ? [initialProduct.imageUrl] : ['']);
      setImages(initialImages);
      setDesc(initialProduct.desc || '');
      setIsFeatured(Boolean(initialProduct.isFeatured));

      // Load initial image into preview if available
      const existingCover = initialImages[0] || initialProduct.imageUrl || '';
      if (existingCover) {
        setPreviewUrl(existingCover);
        setFileMeta({
          name: 'Current Product Photo',
          size: 'Catalog Asset',
          dimensions: 'Verified',
          type: 'Active Image',
          isExisting: true
        });
      } else {
        setPreviewUrl('');
        setFileMeta(null);
      }
    } else {
      setName('');
      setSku('');
      setCategory('feeds');
      setPet('all');
      setPrice('');
      setOriginalPrice('');
      setStockQuantity(25);
      setBadge('');
      setImg('🐾');
      setImages(['']);
      setDesc('');
      setIsFeatured(false);
      setPreviewUrl('');
      setFileMeta(null);
    }
    setStagedFile(null);
    setUploadError('');
    setFieldError('');
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const processSelectedFile = async (file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      showToast(validation.error);
      return;
    }

    setUploadError('');
    const dims = await getImageDimensions(file);
    const objectUrl = URL.createObjectURL(file);

    setStagedFile(file);
    setPreviewUrl(objectUrl);
    setFileMeta({
      name: file.name,
      size: formatFileSize(file.size),
      dimensions: dims.width && dims.height ? `${dims.width} × ${dims.height} px` : 'Valid Dimensions',
      type: file.type.replace('image/', '').toUpperCase(),
      isExisting: false
    });
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setStagedFile(null);
    setPreviewUrl('');
    setFileMeta(null);
    setUploadError('');
    setImages(['']);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setFieldError("Please provide product name and price.");
      return;
    }
    setFieldError('');

    setIsSaving(true);
    try {
      let finalImages = images.map(url => url.trim()).filter(Boolean);

      // Upload newly staged local file to Supabase Storage if present
      if (stagedFile) {
        showToast("⏳ Uploading photo to Supabase Storage...");
        const publicUrl = await uploadProductImage(stagedFile, supabase);
        finalImages = [publicUrl, ...finalImages.filter(u => u !== previewUrl)];
        showToast("✅ Image uploaded successfully!");
      } else if (previewUrl && !previewUrl.startsWith('blob:') && !finalImages.includes(previewUrl)) {
        finalImages = [previewUrl, ...finalImages];
      }

      const payload = {
        name,
        sku,
        category,
        pet,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice) || 0,
        badge,
        img,
        imageUrl: finalImages[0] || '',
        images: finalImages,
        desc,
        isFeatured
      };

      // Only brand new listings can specify initial stock here.
      // Existing product inventory is adjusted intentionally via adjustProductStock.
      if (!initialProduct) {
        payload.stockQuantity = parseInt(stockQuantity, 10) || 0;
      }

      await onSave(payload);
      onClose();
    } catch (error) {
      showToast(error.message || 'The product could not be saved. Please try again.');
      setUploadError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="product-modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(30, 41, 59, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 2100,
      fontFamily: 'var(--font-play)'
    }}>
      <div className="product-modal-card" style={{
        background: '#fff',
        borderRadius: '26px',
        border: '2px solid var(--play-border)',
        boxShadow: '0 24px 60px rgba(45, 49, 66, 0.18)',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, var(--play-yellow) 0%, #FFE197 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--play-charcoal)' }}>
            {initialProduct ? '✏️ Edit Catalog Product' : '➕ Add New Product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(45, 49, 66, 0.12)'
            }}
          >
            <XIcon size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {fieldError && (
            <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
              {fieldError}
            </p>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Product Name *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. Oven-Baked Salmon Biscuits"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldError) setFieldError('');
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Department Category
              </label>
              <select
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="feeds">🥫 Feeds & Food</option>
                <option value="accessories">🎾 Accessories & Toys</option>
                <option value="grooming">🛁 Grooming</option>
                <option value="wellness">💊 Wellness & Health</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Species Target
              </label>
              <select
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={pet}
                onChange={(e) => setPet(e.target.value)}
              >
                <option value="all">🐾 All Pets</option>
                <option value="dog">🐶 Dogs Only</option>
                <option value="cat">🐱 Cats Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Price (₱ PHP) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="29.99"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (fieldError) setFieldError('');
                }}
                required
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Original Price (₱ Strikethrough)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="39.99"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                {initialProduct ? 'Inventory Status' : 'Initial Stock Qty'}
              </label>
              {initialProduct ? (
                <div>
                  <div style={{
                    padding: '8px 12px',
                    background: '#F4F4F5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: stockQuantity > 0 ? '#15803D' : '#DC2626',
                    border: '1px solid #E4E4E7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>{stockQuantity > 0 ? '📦' : '⚠️'}</span>
                    <span>{stockQuantity} in stock</span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#71717A', display: 'block', marginTop: '3px' }}>
                    Protected from edits
                  </span>
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1.5 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Promo Badge (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="e.g. Top Pick, New Recipe, Vet Favorite"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Emoji Fallback
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={img}
                onChange={(e) => setImg(e.target.value)}
              />
            </div>
          </div>

          {/* Main Page Highlight Option */}
          <div
            style={{
              marginBottom: '16px',
              background: isFeatured ? '#FFFBEB' : '#FAFAFA',
              border: `1.5px solid ${isFeatured ? '#FDE68A' : 'var(--play-border)'}`,
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setIsFeatured(prev => !prev)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{isFeatured ? '⭐' : '☆'}</span>
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: isFeatured ? '#92400E' : 'var(--play-charcoal)' }}>
                  Highlight on Main Page
                </strong>
                <span style={{ fontSize: '11px', color: '#71717A' }}>
                  Show in the "Little things. Big tail wags." showcase section
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '18px', height: '18px', accentColor: 'var(--play-orange)', cursor: 'pointer' }}
            />
          </div>

          {/* Direct Image Upload & Live Verification Section */}
          <div style={{
            marginBottom: '18px',
            background: '#FAF5FF',
            borderRadius: '16px',
            border: '1.5px solid #E9D5FF',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#581C87', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📸 Product Cover Photo</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#F3E8FF',
                  color: '#7E22CE',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Max 5MB • JPG, PNG, WEBP
                </span>
              </label>

              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: '4px', background: '#EDE9FE', padding: '2px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    background: uploadMode === 'file' ? '#fff' : 'transparent',
                    color: uploadMode === 'file' ? '#6B21A8' : '#6B7280',
                    cursor: 'pointer',
                    boxShadow: uploadMode === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    background: uploadMode === 'url' ? '#fff' : 'transparent',
                    color: uploadMode === 'url' ? '#6B21A8' : '#6B7280',
                    cursor: 'pointer',
                    boxShadow: uploadMode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Image URL
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="product-file-input"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />

                {/* Live Verification Preview Box */}
                {previewUrl ? (
                  <div style={{
                    display: 'flex',
                    gap: '14px',
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1.5px solid #D8B4FE',
                    padding: '12px',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(126, 34, 206, 0.08)'
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={previewUrl}
                        alt="Product preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Metadata & Verification Badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#DCFCE7',
                          color: '#15803D',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ✓ {fileMeta?.isExisting ? 'Active Catalog Image' : 'Verified & Ready'}
                        </span>
                        {fileMeta?.type && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            background: '#F1F5F9',
                            color: '#475569',
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}>
                            {fileMeta.type}
                          </span>
                        )}
                      </div>

                      <strong style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1E293B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {fileMeta?.name || 'Selected Image'}
                      </strong>

                      <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                        Size: {fileMeta?.size} • {fileMeta?.dimensions}
                      </span>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#6B21A8',
                            background: '#F3E8FF',
                            border: '1px solid #D8B4FE',
                            borderRadius: '6px',
                            padding: '3px 10px',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Replace Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#DC2626',
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '3px 10px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drop / Click-to-Upload Zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      border: `2px dashed ${isDragging ? '#7E22CE' : '#C084FC'}`,
                      background: isDragging ? '#F3E8FF' : '#fff',
                      borderRadius: '12px',
                      padding: '22px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📁</div>
                    <strong style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#581C87' }}>
                      Click to choose or drag & drop your image
                    </strong>
                    <span style={{ fontSize: '11px', color: '#7E22CE', display: 'block', marginTop: '3px' }}>
                      JPEG, JPG, PNG, WEBP • Max 5MB
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* URL fallback mode */
              <div>
                <input
                  type="url"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="https://images.unsplash.com/photo-... (paste link)"
                  value={previewUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setPreviewUrl(url);
                    setImages([url]);
                    setFileMeta(url ? {
                      name: 'External Image Link',
                      size: 'Remote URL',
                      dimensions: 'Online Asset',
                      type: 'URL',
                      isExisting: false
                    } : null);
                  }}
                />
              </div>
            )}

            {uploadError && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: '#FEF2F2',
                borderRadius: '8px',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: 600
              }}>
                ⚠️ {uploadError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Short Description
            </label>
            <textarea
              className="form-input"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="Describe why pets will love this product..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-outline btn-pill"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-pill"
              disabled={isSaving}
            >
              {isSaving ? "Uploading & Saving…" : initialProduct ? "Save Changes" : "Add to Catalog 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
