import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api, type Campaign } from '../api';
import CampaignCard from '../components/CampaignCard';
import { useCampaignsPerPage, useSiteName } from '../contexts/ConfigContext';
import { refreshScrollAnimations } from '../utils/scrollAnimations';
import SkeletonLoader from '../components/SkeletonLoader';
import './CampaignList.css';

/** Strip HTML tags so full-description search works even with WYSIWYG markup */
const stripHtml = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function CampaignList() {
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for pagination
  const [totalServerPages, setTotalServerPages] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');

  const itemsPerPage = useCampaignsPerPage();
  const siteName = useSiteName();

  // Load all campaigns (fetch all pages to allow client-side search/filter)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch first page to discover total page count
        const firstPage = await api.getCampaignsPaginated({ page: 0, size: 100 });
        let items = firstPage.items;

        // If there are more pages, fetch them all in parallel so none are missed in search
        if (firstPage.totalPages > 1) {
          const pageNums = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 1);
          const rest = await Promise.all(
            pageNums.map(p => api.getCampaignsPaginated({ page: p, size: 100 }))
          );
          items = [...items, ...rest.flatMap(r => r.items)];
        }

        setAllCampaigns(items);
        setTotalServerPages(firstPage.totalPages);
        setLoading(false);
        setTimeout(() => refreshScrollAnimations(), 100);
      } catch (err) {
        setError('Failed to load campaigns. Please try again.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Extract unique categories from loaded campaigns
  const categories = useMemo(() => {
    const seen = new Set<string>();
    return allCampaigns
      .filter(c => c.categoryName)
      .reduce<{ id: string; name: string; icon?: string }[]>((acc, c) => {
        if (c.categoryId && !seen.has(c.categoryId)) {
          seen.add(c.categoryId);
          acc.push({ id: c.categoryId, name: c.categoryName!, icon: c.categoryIcon });
        }
        return acc;
      }, []);
  }, [allCampaigns]);

  // Client-side filtering
  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allCampaigns.filter(c => {
      // Multi-word search: split on whitespace and require ALL words to appear
      // somewhere across all searchable fields (so "clean water" and "water clean" both work)
      const matchSearch = (() => {
        if (!q) return true;
        const words = q.split(/\s+/).filter(Boolean);
        const haystack = [
          c.title,
          c.shortDescription || '',
          c.categoryName || '',
          stripHtml(c.description || ''),
          c.location || '',
        ].join(' ').toLowerCase();
        return words.every(word => haystack.includes(word));
      })();
      const matchCategory = !selectedCategory || c.categoryId === selectedCategory;
      const matchBadge =
        !selectedBadge ||
        (selectedBadge === 'urgent' && c.urgent) ||
        (selectedBadge === 'featured' && c.featured);
      return matchSearch && matchCategory && matchBadge;
    });
  }, [allCampaigns, searchQuery, selectedCategory, selectedBadge]);

  // Client-side pagination of filtered results
  const totalFilteredPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalFilteredPages - 1);
  const pagedCampaigns = filteredCampaigns.slice(
    safeCurrentPage * itemsPerPage,
    safeCurrentPage * itemsPerPage + itemsPerPage
  );

  const hasFilters = searchQuery || selectedCategory || selectedBadge;

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(0);
  };

  const handleCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(0);
  };

  const handleBadge = (badge: string) => {
    setSelectedBadge(badge === selectedBadge ? '' : badge);
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBadge('');
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div data-testid="campaign-list">
      <Helmet>
        <title>All Campaigns | {siteName}</title>
        <meta name="description" content="Browse all active donation campaigns supporting education, healthcare, and community development." />
        <meta property="og:title" content={`All Campaigns | ${siteName}`} />
        <meta property="og:description" content="Choose a campaign to support our mission." />
      </Helmet>

      {loading && (
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <SkeletonLoader variant="text" lines={1} width="300px" height="48px" />
            <div style={{ marginTop: '1rem' }}>
              <SkeletonLoader variant="text" lines={1} width="400px" height="20px" />
            </div>
          </div>
          <div className="campaign-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} variant="card" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="container">
          <p className="error">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="container">
          {/* Page heading */}
          <div className="campaigns-page-header">
            <h1>Support a Cause</h1>
            <p className="subtitle">
              {allCampaigns.length} active campaigns — find one that matters to you
            </p>
          </div>

          {/* Search + Filters */}
          <div className="campaigns-filters">
            {/* Search */}
            <div className="campaigns-search-wrap">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                className="campaigns-search"
                placeholder="Search campaigns…"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                aria-label="Search campaigns"
                data-testid="campaigns-search"
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => handleSearch('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category pills */}
            {categories.length > 0 && (
              <div className="campaigns-filter-row" role="group" aria-label="Filter by category">
                <button
                  className={`filter-pill ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => handleCategory('')}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategory(cat.id)}
                  >
                    {cat.icon && <span aria-hidden="true">{cat.icon}</span>} {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Badge quick-filters */}
            <div className="campaigns-filter-row">
              <button
                className={`filter-pill filter-pill-urgent ${selectedBadge === 'urgent' ? 'active' : ''}`}
                onClick={() => handleBadge('urgent')}
              >
                ⚡ Urgent
              </button>
              <button
                className={`filter-pill filter-pill-featured ${selectedBadge === 'featured' ? 'active' : ''}`}
                onClick={() => handleBadge('featured')}
              >
                ⭐ Featured
              </button>

              {hasFilters && (
                <button className="filter-clear" onClick={handleClearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {allCampaigns.length === 0 ? (
            <p className="no-campaigns">No active campaigns at the moment. Check back soon!</p>
          ) : filteredCampaigns.length === 0 ? (
            <div className="campaigns-empty">
              <span aria-hidden="true" style={{ fontSize: '3rem' }}>🔍</span>
              <p>No campaigns match your filters.</p>
              <button className="filter-clear" onClick={handleClearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {hasFilters && (
                <p className="campaigns-results-count">
                  {filteredCampaigns.length} result{filteredCampaigns.length !== 1 ? 's' : ''}
                </p>
              )}
              <div className="campaign-grid">
                {pagedCampaigns.map((campaign) => (
                  <div key={campaign.id} className="scroll-animate-stagger">
                    <CampaignCard campaign={campaign} />
                  </div>
                ))}
              </div>

              {totalFilteredPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 0}
                    className="pagination-btn"
                    data-testid="campaigns-prev"
                  >
                    ← Previous
                  </button>

                  <div className="pagination-numbers">
                    {Array.from({ length: totalFilteredPages }, (_, i) => i).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`pagination-number ${safeCurrentPage === page ? 'active' : ''}`}
                        data-testid={`campaigns-page-${page + 1}`}
                      >
                        {page + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalFilteredPages - 1}
                    className="pagination-btn"
                    data-testid="campaigns-next"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
