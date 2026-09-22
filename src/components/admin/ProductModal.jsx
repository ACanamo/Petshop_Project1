import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import {
  validateImageFile,
  validateMultipleImageFiles,
  formatFileSize,
  getImageDimensions,
  uploadProductImage,
  MAX_FILE_SIZE_BYTES
} from '../../lib/imageUpload';
import { XIcon } from '@phosphor-icons/react';

const SLOT_CONFIG = [
  { key: 'cover', label: 'Cover Photo', badge: '⭐ Primary / Cover', desc: 'Main catalog card & cart' },
  { key: 'angle2', label: 'Angle / Side', badge: '📸 Angle 2', desc: 'Side view / nutrition' },
  { key: 'angle3', label: 'Detail / In-Use', badge: '🔍 Angle 3', desc: 'Packaging / close-up' }
];

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
  const [desc, setDesc] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');

  // 3-Photo Upload & Verification States
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [slots, setSlots] = useState([
    { previewUrl: '', stagedFile: null, meta: null },
    { previewUrl: '', stagedFile: null, meta: null },
    { previewUrl: '', stagedFile: null, meta: null }
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [uploadError, setUploadError] = useState('');

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
      setDesc(initialProduct.desc || '');
      setIsFeatured(Boolean(initialProduct.isFeatured));

      const rawImages = Array.isArray(initialProduct.images) && initialProduct.images.length > 0
        ? initialProduct.images
        : (initialProduct.imageUrl ? [initialProduct.imageUrl] : []);

      const loadedSlots = [0, 1, 2].map(idx => {
        const url = rawImages[idx] || '';
        if (url) {
          return {
            previewUrl: url,
            stagedFile: null,
            meta: {
              name: idx === 0 ? 'Cover Photo' : `Photo ${idx + 1}`,
              size: 'Catalog Asset',
              dimensions: 'Verified',
              type: 'Active Image',
              isExisting: true
            }
          };
        }
        return { previewUrl: '', stagedFile: null, meta: null };
      });
      setSlots(loadedSlots);
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
      setDesc('');
      setIsFeatured(false);
      setSlots([
        { previewUrl: '', stagedFile: null, meta: null },
        { previewUrl: '', stagedFile: null, meta: null },
        { previewUrl: '', stagedFile: null, meta: null }
      ]);
    }
    setUploadError('');
    setFieldError('');
  }, [initialProduct, isOpen]);

  // Clean up any staged blob URLs on unmount
  useEffect(() => {
    return () => {
      slots.forEach(s => {
        if (s.previewUrl && s.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(s.previewUrl);
        }
      });
    };
  }, [slots]);

  if (!isOpen) return null;

  const triggerFileInput = (slotIndex) => {
    setActiveSlotIndex(slotIndex);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const processFilesForSlots = async (fileList, startingIndex = 0) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setUploadError('');

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const validation = validateImageFile(files[i]);
      if (!validation.valid) {
        const errMsg = files.length > 1 ? `File ${i + 1} (${files[i].name}): ${validation.error}` : validation.error;
        setUploadError(errMsg);
        showToast(errMsg);
        return;
      }
    }

    const updatedSlots = [...slots];
    let targetIndex = startingIndex;

    for (let i = 0; i < files.length; i++) {
      if (targetIndex >= 3) break;

      const file = files[i];
      const oldUrl = updatedSlots[targetIndex]?.previewUrl;
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }

      const dims = await getImageDimensions(file);
      const objectUrl = URL.createObjectURL(file);

      updatedSlots[targetIndex] = {
        previewUrl: objectUrl,
        stagedFile: file,
        meta: {
          name: file.name,
          size: formatFileSize(file.size),
          dimensions: dims.width && dims.height ? `${dims.width} × ${dims.height} px` : 'Valid Dimensions',
          type: (file.type || '').replace('image/', '').toUpperCase() || 'IMAGE',
          isExisting: false
        }
      };

      targetIndex++;
    }

    setSlots(updatedSlots);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesForSlots(e.target.files, activeSlotIndex);
    }
  };

  const handleRemoveSlot = (index) => {
    const slot = slots[index];
    if (slot?.previewUrl && slot.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(slot.previewUrl);
    }
    const updatedSlots = [...slots];
    updatedSlots[index] = { previewUrl: '', stagedFile: null, meta: null };
    setSlots(updatedSlots);
  };

  const handleUrlChange = (index, val) => {
    const url = val.trim();
    const updatedSlots = [...slots];
    updatedSlots[index] = {
      previewUrl: url,
      stagedFile: null,
      meta: url ? {
        name: index === 0 ? 'Cover URL' : `Photo ${index + 1} URL`,
        size: 'Remote URL',
        dimensions: 'Online Asset',
        type: 'URL',
        isExisting: true
      } : null
    };
    setSlots(updatedSlots);
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
      // Find all slots with newly staged files that need to be uploaded to Supabase Storage
      const stagedSlots = slots.map((s, idx) => ({ ...s, index: idx })).filter(s => s.stagedFile);
      const totalStaged = stagedSlots.length;
      const finalImageUrls = [...slots.map(s => s.previewUrl)];

      if (totalStaged > 0) {
        for (let i = 0; i < totalStaged; i++) {
          const { stagedFile, index } = stagedSlots[i];
          showToast(`⏳ Uploading photo ${i + 1} of ${totalStaged} to Supabase Storage...`);
          const publicUrl = await uploadProductImage(stagedFile, supabase);
          finalImageUrls[index] = publicUrl;
        }
        showToast("✅ All photos uploaded to Supabase successfully!");
      }

      // Collect all non-empty URLs (up to 3)
      const finalImages = finalImageUrls.map(u => (u || '').trim()).filter(Boolean).slice(0, 3);

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

          {/* Direct Image Upload & Live Verification Section (3 Slots) */}
          <div style={{
            marginBottom: '18px',
            background: '#FAF5FF',
            borderRadius: '16px',
            border: '1.5px solid #E9D5FF',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#581C87', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📸 Product Photos (Up to 3 Photos)</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#F3E8FF',
                  color: '#7E22CE',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Max 5MB each • JPG, PNG, WEBP
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
                  Upload Files
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
                  Image URLs
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                {/* Hidden File Input (supports single or multiple file selection) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="product-file-input"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />

                {/* 3 Upload Slots Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {SLOT_CONFIG.map((cfg, idx) => {
                    const slot = slots[idx] || { previewUrl: '', meta: null };
                    const hasImage = Boolean(slot.previewUrl);
                    const isDragActive = dragOverSlot === idx;

                    return (
                      <div
                        key={idx}
                        onDragOver={(e) => { e.preventDefault(); setDragOverSlot(idx); }}
                        onDragLeave={() => setDragOverSlot(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverSlot(null);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            processFilesForSlots(e.dataTransfer.files, idx);
                          }
                        }}
                        style={{
                          background: hasImage ? '#fff' : (isDragActive ? '#F3E8FF' : '#FAF5FF'),
                          border: `1.5px ${hasImage ? 'solid #D8B4FE' : 'dashed ' + (isDragActive ? '#7E22CE' : '#C084FC')}`,
                          borderRadius: '14px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          boxShadow: hasImage ? '0 2px 8px rgba(126, 34, 206, 0.08)' : 'none'
                        }}
                      >
                        {/* Slot Header / Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            color: idx === 0 ? '#92400E' : '#6B21A8',
                            background: idx === 0 ? '#FEF3C7' : '#EDE9FE',
                            padding: '2px 7px',
                            borderRadius: '999px'
                          }}>
                            {cfg.badge}
                          </span>
                          {hasImage && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#15803D',
                              background: '#DCFCE7',
                              padding: '1px 6px',
                              borderRadius: '999px'
                            }}>
                              ✓ {slot.meta?.isExisting ? 'Saved' : 'Ready'}
                            </span>
                          )}
                        </div>

                        {/* Thumbnail or Empty Dropzone */}
                        {hasImage ? (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '100%',
                              height: '110px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              marginBottom: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img
                                src={slot.previewUrl}
                                alt={`Product slot ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>

                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#334155',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%',
                              marginBottom: '8px'
                            }}>
                              {slot.meta?.name || `Image ${idx + 1}`}
                            </span>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => triggerFileInput(idx)}
                                style={{
                                  flex: 1,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#6B21A8',
                                  background: '#F3E8FF',
                                  border: '1px solid #D8B4FE',
                                  borderRadius: '6px',
                                  padding: '4px 6px',
                                  cursor: 'pointer'
                                }}
                              >
                                🔄 Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(idx)}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#DC2626',
                                  background: '#FEE2E2',
                                  border: '1px solid #FECACA',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                                title="Remove photo"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => triggerFileInput(idx)}
                            style={{
                              width: '100%',
                              minHeight: '135px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: '8px 4px'
                            }}
                          >
                            <div style={{ fontSize: '26px', marginBottom: '4px' }}>📁</div>
                            <strong style={{ fontSize: '12px', color: '#581C87', display: 'block' }}>
                              + Upload {idx === 0 ? 'Cover' : `Photo ${idx + 1}`}
                            </strong>
                            <span style={{ fontSize: '10px', color: '#7E22CE', marginTop: '3px' }}>
                              {cfg.desc}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* URL Mode: 3 Clean URL Inputs */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SLOT_CONFIG.map((cfg, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      {slots[idx]?.previewUrl ? (
                        <img
                          src={slots[idx].previewUrl}
                          alt={`Slot ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span>{idx === 0 ? '⭐' : '📸'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="url"
                        className="form-input"
                        style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px', padding: '8px 12px' }}
                        placeholder={`Photo ${idx + 1} URL (${cfg.label})`}
                        value={slots[idx]?.previewUrl || ''}
                        onChange={(e) => handleUrlChange(idx, e.target.value)}
                      />
                    </div>
                    {slots[idx]?.previewUrl && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(idx)}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title="Clear URL"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <div style={{
                marginTop: '10px',
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
