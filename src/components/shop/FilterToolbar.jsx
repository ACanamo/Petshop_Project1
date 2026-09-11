import React from 'react';

function FilterIcon({ name }) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="5.75" />
        <path d="m15 15 4.25 4.25" />
      </>
    ),
    paw: (
      <>
        <ellipse cx="12" cy="15.4" rx="4.7" ry="3.8" />
        <circle cx="6.4" cy="10.2" r="2" />
        <circle cx="10.2" cy="6.7" r="2" />
        <circle cx="14.3" cy="6.7" r="2" />
        <circle cx="17.8" cy="10.2" r="2" />
      </>
    ),
    dog: (
      <>
        <path d="M7.4 9.2 4.7 6.8 4 12.1l2.1 1.8M16.6 9.2l2.7-2.4.7 5.3-2.1 1.8" />
        <path d="M6.2 11.3c0-3.4 2.4-5.8 5.8-5.8s5.8 2.4 5.8 5.8v3.2c0 3.1-2.5 5.4-5.8 5.4s-5.8-2.3-5.8-5.4z" />
        <path d="M9.4 13.4h.1M14.5 13.4h.1M10.2 16.1c1.1 1 2.5 1 3.6 0" />
      </>
    ),
    cat: (
      <>
        <path d="m6.3 8.8.4-4.4 3.5 2.2a8 8 0 0 1 3.6 0l3.5-2.2.4 4.4a6.9 6.9 0 1 1-11.4 0Z" />
        <path d="M9.2 13h.1M14.7 13h.1M10.4 15.5h3.2M5.2 14.5l3.1.5M18.8 14.5l-3.1.5" />
      </>
    ),
    grid: (
      <>
        <rect x="4.5" y="4.5" width="6" height="6" rx="1.25" />
        <rect x="13.5" y="4.5" width="6" height="6" rx="1.25" />
        <rect x="4.5" y="13.5" width="6" height="6" rx="1.25" />
        <rect x="13.5" y="13.5" width="6" height="6" rx="1.25" />
      </>
    ),
    bowl: (
      <>
        <path d="M4.5 11.5h15c-.4 5-3.2 7.5-7.5 7.5s-7.1-2.5-7.5-7.5Z" />
        <path d="M8 8.5c.7-2 2.1-3 4-3s3.3 1 4 3M3.5 11.5h17" />
      </>
    ),
    bone: (
      <path d="M7.3 8.1a2.7 2.7 0 1 0-3.8 3.8 2.7 2.7 0 1 0 3.8 3.8l9.4-9.4a2.7 2.7 0 1 0 3.8-3.8 2.7 2.7 0 1 0-3.8 3.8Z" />
    ),
    grooming: (
      <>
        <path d="M7 4.5h10v5.2a5 5 0 0 1-10 0Z" />
        <path d="M9 4.5v5M12 4.5v5M15 4.5v5M12 14.7v5" />
      </>
    ),
    wellness: (
      <>
        <path d="M12 20s-7.5-4.3-7.5-10.1A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3C19.5 15.7 12 20 12 20Z" />
        <path d="M12 8.8v5.8M9.1 11.7h5.8" />
      </>
    )
  };

  return (
    <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function FilterToolbar({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedPet,
  setSelectedPet,
  sortBy,
  setSortBy,
  productCount,
  onReset
}) {
  const categories = [
    { id: 'all', label: 'All items', icon: 'grid' },
    { id: 'feeds', label: 'Food & treats', icon: 'bowl' },
    { id: 'accessories', label: 'Accessories & toys', icon: 'bone' },
    { id: 'grooming', label: 'Grooming', icon: 'grooming' },
    { id: 'wellness', label: 'Health & wellness', icon: 'wellness' }
  ];

  const pets = [
    { id: 'all', label: 'All pets', icon: 'paw' },
    { id: 'dog', label: 'Dogs', icon: 'dog' },
    { id: 'cat', label: 'Cats', icon: 'cat' }
  ];

  const hasActiveFilters = Boolean(
    search || selectedCategory !== 'all' || selectedPet !== 'all' || sortBy !== 'popular'
  );

  return (
    <section className="filter-toolbar-container" aria-label="Catalog filters">
      <div className="filter-toolbar-layout">
        <div className="search-input-wrap catalog-search-wrap">
          <FilterIcon name="search" />
          <input
            type="search"
            className="form-input catalog-search-input"
            placeholder="Search treats, leashes, kibble, beds…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
          />
          {search && (
            <button
              type="button"
              className="catalog-clear-search"
              onClick={() => setSearch('')}
              aria-label="Clear product search"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        <div className="pet-toggle-group" role="group" aria-label="Filter by pet type">
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              className={`pet-filter-pill ${selectedPet === pet.id ? 'active' : ''}`}
              onClick={() => setSelectedPet(pet.id)}
              aria-pressed={selectedPet === pet.id}
            >
              <FilterIcon name={pet.icon} />
              <span>{pet.label}</span>
            </button>
          ))}
        </div>

        <div className="sort-wrap">
          <label htmlFor="sort-select" className="catalog-sort-label">Sort</label>
          <select
            id="sort-select"
            className="form-input catalog-sort-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="popular">Most popular</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
            <option value="name-asc">Name: A–Z</option>
          </select>
        </div>

        <div className="category-pills-row" role="group" aria-label="Filter by product category" tabIndex="0">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`cat-pill-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
            >
              <FilterIcon name={category.icon} />
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        <div className="catalog-results-row">
          <p className="catalog-result-count" aria-live="polite" aria-atomic="true">
            <span className="catalog-result-count-number">{productCount}</span>
            <span>{productCount === 1 ? 'product' : 'products'}</span>
          </p>
          {hasActiveFilters && (
            <button type="button" className="catalog-reset-btn" onClick={onReset} aria-label="Reset all filters">
              <span aria-hidden="true">↺</span>
              <span className="catalog-reset-copy">Reset</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
