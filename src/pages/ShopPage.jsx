import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import FilterToolbar from '../components/shop/FilterToolbar';
import ProductCard from '../components/shop/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ShopPage() {
  const { products, loading } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPet, setSelectedPet] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Sync category filter and search query from URL parameter (e.g. /shop?cat=feeds or /shop?q=chew)
  useEffect(() => {
    const cat = searchParams.get('cat')?.toLowerCase();
    const validCategories = ['feeds', 'accessories', 'grooming', 'wellness'];
    setSelectedCategory(validCategories.includes(cat) ? cat : 'all');

    setSearch(searchParams.get('q') || '');
    const pet = searchParams.get('pet');
    setSelectedPet(['dog', 'cat'].includes(pet) ? pet : 'all');
  }, [searchParams]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const nextParams = new URLSearchParams(searchParams);
    if (category === 'all') nextParams.delete('cat');
    else nextParams.set('cat', category);
    setSearchParams(nextParams, { replace: true });
  };

  const handlePetChange = (pet) => {
    setSelectedPet(pet);
    const nextParams = new URLSearchParams(searchParams);
    if (pet === 'all') nextParams.delete('pet');
    else nextParams.set('pet', pet);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set('q', value);
    else nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  };

  const filteredProducts = useMemo(() => (
    products
      .filter((product) => {
        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
        if (selectedPet !== 'all' && product.pet !== 'all' && product.pet !== selectedPet) return false;

        if (search.trim()) {
          const query = search.toLowerCase();
          const nameMatch = product.name.toLowerCase().includes(query);
          const descriptionMatch = (product.desc || '').toLowerCase().includes(query);
          const categoryMatch = (product.categoryLabel || '').toLowerCase().includes(query);
          if (!nameMatch && !descriptionMatch && !categoryMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return (b.popularity || 90) - (a.popularity || 90);
      })
  ), [products, search, selectedCategory, selectedPet, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedPet('all');
    setSortBy('popular');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('cat');
    nextParams.delete('pet');
    nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <main className="shop-page-main">
      <div className="play-wrap shop-catalog-wrap">
        <div className="shop-catalog-header">
          <span className="play-section-pill">Fresh &amp; Wholesome Goodies</span>
          <h1 className="play-section-title shop-catalog-title">PETCHUP Catalog</h1>
          <p className="play-section-sub shop-catalog-sub">
            Browse our hand-curated feeds, high-tensile leashes, calming beds, and vet-backed wellness oils.
          </p>
        </div>

        <FilterToolbar
          search={search}
          setSearch={handleSearchChange}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
          selectedPet={selectedPet}
          setSelectedPet={handlePetChange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          productCount={filteredProducts.length}
          onReset={handleResetFilters}
        />

        {loading && products.length === 0 ? (
          <LoadingSpinner label="Loading the catalog…" />
        ) : filteredProducts.length === 0 ? (
          <div className="shop-empty-state">
            <div className="shop-empty-icon">🔎</div>
            <h3>No goodies found matching your search!</h3>
            <p>Try searching with different keywords or resetting your category and species filters.</p>
            <button type="button" className="btn btn-primary btn-pill" onClick={handleResetFilters}>
              Reset All Filters ↺
            </button>
          </div>
        ) : (
          <div className="products-grid shop-products-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
