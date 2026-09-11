import React from 'react';
import { formatPeso } from '../../lib/constants';

export default function MetricsRibbon({ products, announcements, orders }) {
  const totalProducts = products.length;
  const feedsCount = products.filter(p => p.category === 'feeds').length;
  const accessoriesCount = products.filter(p => p.category === 'accessories').length;
  const activeAnnouncementsCount = announcements.filter(a => a.isActive).length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const metrics = [
    { label: "Catalog Products", value: totalProducts, icon: "📦", tint: "#FFF7D6", border: "#FDE68A" },
    { label: "Feeds & Foods", value: feedsCount, icon: "🥫", tint: "#FFEAD9", border: "#FFCFAF" },
    { label: "Accessories & Toys", value: accessoriesCount, icon: "🎾", tint: "#D8F8F0", border: "#A7F3D0" },
    { label: "Active Deals", value: activeAnnouncementsCount, icon: "📢", tint: "#EFE9FF", border: "#D9CCFF" },
    { label: "Total Orders", value: totalOrders, icon: "🛍️", tint: "#FFE4EC", border: "#FFC4D6" },
    { label: "Store Revenue", value: formatPeso(totalRevenue), icon: "💰", tint: "#D8F8F0", border: "#A7F3D0" }
  ];

  return (
    <div className="admin-metrics-ribbon" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="admin-metric-card"
          style={{
            background: m.tint,
            border: `1.5px solid ${m.border}`,
            borderRadius: '18px',
            padding: '18px',
            boxShadow: '0 4px 14px rgba(45, 49, 66, 0.05)'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{m.icon}</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#5b5342', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {m.label}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--play-charcoal)', marginTop: '4px' }}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}
