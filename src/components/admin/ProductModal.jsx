import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { XIcon } from '@phosphor-icons/react';

export default function ProductModal({ isOpen, onClose, onSave, initialProduct }) {
  const { showToast } = useCart();
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
  const [isSaving, setIsSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');

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
    }
    setFieldError('');
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setFieldError("Please provide product name and price.");
      return;
    }
    setFieldError('');

    setIsSaving(true);
    try {
      await onSave({
        name,
        sku,
        category,
        pet,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice) || 0,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        badge,
        img,
        images: images.map(url => url.trim()).filter(Boolean),
        desc
      });
      onClose();
    } catch (error) {
      showToast(error.message || 'The product could not be saved. Please try again.');
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
        maxWidth: '560px',
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
                Stock Qty
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
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

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Product Images (Unsplash or direct links — first one is the cover photo)
            </label>
            {images.map((url, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="url"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder={idx === 0 ? "https://images.unsplash.com/photo-... (cover photo)" : "https://images.unsplash.com/photo-..."}
                  value={url}
                  onChange={(e) => {
                    const next = [...images];
                    next[idx] = e.target.value;
                    setImages(next);
                  }}
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    aria-label="Remove image"
                    style={{
                      flexShrink: 0,
                      width: '38px',
                      border: '1px solid var(--play-border)',
                      borderRadius: '10px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: '#ef4444'
                    }}
                  >
                    <XIcon size={16} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-pill"
              onClick={() => setImages([...images, ''])}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              + Add Another Image
            </button>
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
              {isSaving ? "Saving…" : initialProduct ? "Save Changes" : "Add to Catalog 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
