import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BowlFood, Bone, GridFour, Heart, PawPrint, Sparkle, X } from '@phosphor-icons/react';
import { useStore } from '../context/StoreContext';
import { FeaturedCard } from '../components/home/FeaturedProducts';
import LoadingSpinner from '../components/common/LoadingSpinner';

const categories = [
  { id: 'all', name: 'All the good stuff', icon: GridFour },
  { id: 'feeds', name: 'Food & treats', icon: BowlFood },
  { id: 'accessories', name: 'Toys & accessories', icon: Bone },
  { id: 'grooming', name: 'Grooming', icon: Sparkle },
  { id: 'wellness', name: 'Wellness', icon: Heart },
];

const validCategories = categories.filter((category) => category.id !== 'all').map((category) => category.id);

export default function ShopPage() {
  const { products, loading } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPet, setSelectedPet] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const category = searchParams.get('cat')?.toLowerCase();
    setSelectedCategory(validCategories.includes(category) ? category : 'all');
    setSelectedPet(['dog', 'cat'].includes(searchParams.get('pet')) ? searchParams.get('pet') : 'all');
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  function updateParam(name, value, defaultValue) {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) nextParams.delete(name);
    else nextParams.set(name, value);
    setSearchParams(nextParams, { replace: true });
  }

  function handleCategoryChange(category) {
    setSelectedCategory(category);
    updateParam('cat', category, 'all');
  }

  function handlePetChange(pet) {
    setSelectedPet(pet);
    updateParam('pet', pet, 'all');
  }

  function handleSearchChange(value) {
    setSearch(value);
    updateParam('q', value.trim(), '');
  }

  function handleResetFilters() {
    setSearch('');
    setSelectedCategory('all');
    setSelectedPet('all');
    setSortBy('popular');
    const nextParams = new URLSearchParams(searchParams);
    ['cat', 'pet', 'q'].forEach((key) => nextParams.delete(key));
    setSearchParams(nextParams, { replace: true });
  }

  const matchingProducts = useMemo(() => products.filter((product) => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
    if (selectedPet !== 'all' && product.pet !== 'all' && product.pet !== selectedPet) return false;
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    return product.name.toLowerCase().includes(query)
      || (product.desc || '').toLowerCase().includes(query)
      || (product.categoryLabel || '').toLowerCase().includes(query);
  }), [products, selectedCategory, selectedPet, search]);

  const filteredProducts = useMemo(() => [...matchingProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return (b.popularity || 90) - (a.popularity || 90);
  }), [matchingProducts, sortBy]);

  function categoryCount(categoryId) {
    return products.filter((product) => {
      if (categoryId !== 'all' && product.category !== categoryId) return false;
      if (selectedPet !== 'all' && product.pet !== 'all' && product.pet !== selectedPet) return false;
      if (!search.trim()) return true;
      const query = search.trim().toLowerCase();
      return product.name.toLowerCase().includes(query)
        || (product.desc || '').toLowerCase().includes(query)
        || (product.categoryLabel || '').toLowerCase().includes(query);
    }).length;
  }

  const activeCategory = categories.find((category) => category.id === selectedCategory);

  return <main className="shop-page-main pg-shop-main">
    <section className="pg-shop-billboard" aria-label="Petchup pet shop"><div className="pg-wrap pg-shop-billboard-inner">
      <span className="pg-shop-billboard-heart" aria-hidden="true">♡</span>
      <div><p>Your happy little pet shop</p><h1>Good things for great pets.</h1></div>
      <img src="/images/banner_kitten_cutout.png" alt="" aria-hidden="true" width="190" height="150" />
      <span className="pg-shop-billboard-tail" aria-hidden="true">Happier pets.<br />Brighter days. <PawPrint weight="fill" /></span>
    </div></section>
    <div className="pg-wrap pg-shop-wrap">
      <nav className="pg-shop-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Shop</span></nav>
      <div className="pg-shop-layout">
        <aside className="pg-shop-sidebar" aria-label="Catalog filters">
          <div className="pg-sidebar-heading"><h2>Find their favorites</h2><Sparkle size={22} aria-hidden="true" /></div>
          <fieldset className="pg-filter-fieldset pg-pet-fieldset"><legend>Shopping for</legend><div className="pg-pet-filter">
            {[{ id: 'all', label: 'All pets' }, { id: 'dog', label: 'Dogs' }, { id: 'cat', label: 'Cats' }].map((pet) => <button className={selectedPet === pet.id ? 'is-active' : ''} key={pet.id} type="button" onClick={() => handlePetChange(pet.id)} aria-pressed={selectedPet === pet.id}>{pet.id === 'all' && <PawPrint size={17} weight="fill" aria-hidden="true" />}{pet.label}</button>)}
          </div></fieldset>
          <fieldset className="pg-filter-fieldset pg-category-fieldset"><legend>Shop by category</legend><div className="pg-sidebar-categories">
            {categories.map(({ id, name, icon: Icon }) => <button className={selectedCategory === id ? 'is-active' : ''} key={id} type="button" onClick={() => handleCategoryChange(id)} aria-pressed={selectedCategory === id}><Icon size={20} weight={selectedCategory === id ? 'fill' : 'regular'} aria-hidden="true" /><span>{name}</span><span className="pg-filter-count">{categoryCount(id)}</span></button>)}
          </div></fieldset>
          {(search || selectedCategory !== 'all' || selectedPet !== 'all' || sortBy !== 'popular') && <button type="button" className="pg-filter-reset" onClick={handleResetFilters}><X size={17} aria-hidden="true" /> Reset filters</button>}
          <div className="pg-sidebar-doodle" aria-hidden="true"><PawPrint size={40} weight="fill" /><p>Good pets.<br />Happy people.</p><Heart size={23} /></div>
        </aside>
        <section className="pg-shop-results" aria-labelledby="pg-shop-heading">
          <div className="pg-shop-results-heading"><div><h2 id="pg-shop-heading">{selectedCategory === 'all' ? 'All the good stuff' : activeCategory?.name}</h2><p className="pg-shop-count" aria-live="polite">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</p></div>
            <label className="pg-shop-sort"><span>Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products"><option value="popular">Most popular</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Highest rated</option><option value="name-asc">Name: A–Z</option></select></label>
          </div>
          <form className="pg-shop-search" role="search" onSubmit={(event) => event.preventDefault()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg><input type="search" value={search} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search products, brands, or treats…" aria-label="Search catalog products" />{search && <button type="button" onClick={() => handleSearchChange('')} aria-label="Clear search"><X size={18} aria-hidden="true" /></button>}</form>
          {loading && products.length === 0 ? <LoadingSpinner label="Loading the catalog…" /> : filteredProducts.length === 0 ? <div className="pg-shop-empty"><PawPrint size={42} weight="duotone" aria-hidden="true" /><h3>No goodies found just yet.</h3><p>Try another search or reset your filters to see all the favorites.</p><button className="pg-shop-empty-button" type="button" onClick={handleResetFilters}>Show all products</button></div> : <div className="pg-shop-grid">{filteredProducts.map((product) => <FeaturedCard key={product.id} product={product} />)}</div>}
        </section>
      </div>
    </div>
  </main>;
}
