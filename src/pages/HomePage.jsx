import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, PawPrint, Sparkle } from '@phosphor-icons/react';
import FeaturedProducts from '../components/home/FeaturedProducts';

const categories = [
  { id: 'feeds', name: 'Food & treats', text: 'Full bowls. Happy souls.', image: 'hd_category_feeds.jpg' },
  { id: 'accessories', name: 'Toys & accessories', text: 'More play, every day.', image: 'hd_category_accessories.jpg' },
  { id: 'grooming', name: 'Grooming', text: 'Fresh looks. Happy pets.', image: 'hd_category_grooming.jpg' },
  { id: 'wellness', name: 'Wellness', text: 'A little extra care.', image: 'hd_category_wellness.jpg' },
];

export default function HomePage() {
  return <main id="main-content" className="playground">
    <section className="pg-hero" aria-labelledby="pg-heading"><div className="pg-wrap pg-hero-layout">
      <div className="pg-hero-copy"><p className="pg-welcome"><PawPrint size={17} weight="fill" aria-hidden="true" /> Your happy little pet shop</p>
        <h1 id="pg-heading">Little paws.<br />Big happiness.<svg className="pg-sunshine" viewBox="0 0 70 70" fill="none" aria-hidden="true"><path d="M15 29 22 7M30 40 51 22M35 56 63 52" stroke="currentColor" strokeWidth="9" strokeLinecap="round" /></svg></h1>
        <p className="pg-intro">Everything your pet needs for a brighter,<br className="pg-desktop-break" /> more playful life. All in one happy place.</p>
        <Link to="/shop" className="pg-button">Shop favorites <ArrowRight size={20} aria-hidden="true" /></Link><a className="pg-hero-secondary" href="#categories">Find their everyday essentials</a>
      </div>
      <div className="pg-hero-art"><div className="pg-pet-halo" /><img className="pg-hero-pets" src="/images/hero_pets_hd_cutout.png" alt="A golden retriever and tuxedo cat, your new favorite shopping companions" fetchPriority="high" width="720" height="600" />
        <div className="pg-club-sticker" aria-hidden="true"><PawPrint size={25} weight="fill" /><span>Good<br />pet club</span></div>
        <div className="pg-hero-note" aria-hidden="true">Good pets.<br />Happy people.<Heart size={27} /></div>
        <svg className="pg-doodle-heart" viewBox="0 0 60 70" fill="none" aria-hidden="true"><path d="M31 60S-6 27 9 12c11-9 20 8 21 19 0-15 5-29 16-23 18 13-9 47-15 52Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
        <svg className="pg-doodle-rays" viewBox="0 0 65 65" fill="none" aria-hidden="true"><path d="m10 29 14-19M22 40l27-13M25 54l27 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
      </div>
    </div></section>
    <section className="pg-categories" id="categories" aria-label="Shop by category">
      <svg className="pg-wave pg-wave-top" viewBox="0 0 1440 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 25C180 85 320-20 520 18S800 60 1010 22s280-15 430 3v25H0Z" /></svg>
      <div className="pg-wrap pg-category-grid">{categories.map(category => <Link className={`pg-category pg-category-${category.id}`} key={category.id} to={`/shop?cat=${category.id}`}><img src={`/images/${category.image}`} alt="" width="125" height="125" /><div><h2>{category.name}</h2><p>{category.text}</p></div><span className="pg-category-arrow"><ArrowRight size={18} aria-hidden="true" /></span></Link>)}</div>
      <svg className="pg-wave pg-wave-bottom" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h1440v14c-180 55-320-20-520 4S650 55 430 20 140 50 0 20Z" /></svg>
    </section>
    <FeaturedProducts />
    <section className="pg-pet-collections pg-wrap" aria-labelledby="pg-pets-heading"><div className="pg-section-head"><div><p>For every kind of best friend</p><h2 id="pg-pets-heading">Their world. A little happier.</h2></div><Heart className="pg-section-heart" size={40} aria-hidden="true" /></div><div className="pg-collection-grid">
      <Link className="pg-collection pg-dogs" to="/shop?pet=dog"><div><span>Team tail wags</span><h3>Good days<br />for good dogs.</h3><p>From breakfast bowls to one more game of fetch.</p><span className="pg-collection-cta">Shop for dogs <ArrowRight size={18} aria-hidden="true" /></span></div><img src="/images/banner_puppy_cutout.png" alt="A playful golden retriever puppy" loading="lazy" width="360" height="360" /></Link>
      <Link className="pg-collection pg-cats" to="/shop?pet=cat"><div><span>Team happy purrs</span><h3>A little love.<br />A lot of purrs.</h3><p>Little comforts for your favorite independent spirit.</p><span className="pg-collection-cta">Shop for cats <ArrowRight size={18} aria-hidden="true" /></span></div><img src="/images/banner_kitten_cutout.png" alt="A curious fluffy kitten" loading="lazy" width="360" height="360" /></Link>
    </div></section>
    <section className="pg-about" id="about" aria-labelledby="pg-about-heading"><div className="pg-wrap pg-about-layout"><div className="pg-about-art"><img src="/images/banner_puppy_hd.jpg" alt="A puppy enjoying a sunny play break" loading="lazy" width="600" height="430" /><span className="pg-photo-note">More love for every little paw <Heart size={22} aria-hidden="true" /></span></div><div className="pg-about-copy"><Sparkle size={33} weight="duotone" aria-hidden="true" /><h2 id="pg-about-heading">They make life better.<br />Let’s return the favor.</h2><p>The excited welcome home. The warm spot on the sofa. The little moments that mean everything.</p><p>Petchup brings together food, play, grooming, and everyday care for the pets who make your world a happier place.</p><Link to="/shop" className="pg-text-link">Find their next favorite <ArrowRight size={19} aria-hidden="true" /></Link></div></div></section>
    <section className="pg-faq pg-wrap" id="help" aria-labelledby="pg-help-heading"><div><p>A little help goes a long way</p><h2 id="pg-help-heading">Good questions.<br />Happy shopping.</h2></div><div className="pg-faq-list">
      <details><summary>How do I find products for my pet?</summary><p>Browse <Link to="/shop?pet=dog">dog essentials</Link> or <Link to="/shop?pet=cat">cat essentials</Link>, then narrow your results by category. You can also search by product name.</p></details>
      <details><summary>Can I take a closer look before buying?</summary><p>Yes! Select a product’s photo or name to see its details, price, and availability. Add it to your cart when you’ve found a favorite.</p></details>
      <details><summary>Where can I review my cart and orders?</summary><p>Open Cart at the top of the page to review items and quantities. After signing in, open your account menu and choose My Orders to see your order history.</p></details>
    </div></section>
  </main>;
}
