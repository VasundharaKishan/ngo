import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import { fetchDonationsPaginated, type DonationPageResponse } from '../api';
import { usePaginationParams } from '../hooks/usePaginationParams';
import { useDebounce } from '../hooks/useDebounce';
import './Donations.css';

export default function Donations() {
  const [data, setData] = useState<DonationPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const { page, size, sort, q, status, setPage, setSize, setSort, setQuery, setStatus, reset } = usePaginationParams();
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update query when debounced search changes
  useEffect(() => {
    setQuery(debouncedSearch);
  }, [debouncedSearch, setQuery]);

  // Load donations when filters change
  useEffect(() => {
    const loadDonations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchDonationsPaginated({ page, size, sort, q, status });
        setData(response);
      } catch (err) {
        console.error('Error loading donations:', err);
        setError('Failed to load donations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDonations();
  }, [page, size, sort, q, status]);

  const handleClearFilters = () => {
    setSearchInput('');
    reset();
  };

  const handleSortChange = (field: string) => {
    const [currentField, currentDir] = sort.split(',');
    if (currentField === field) {
      // Toggle direction
      const newDir = currentDir === 'asc' ? 'desc' : 'asc';
      setSort(`${field},${newDir}`);
    } else {
      // New field, default to desc
      setSort(`${field},desc`);
    }
  };

  const getSortIcon = (field: string) => {
    const [currentField, currentDir] = sort.split(',');
    if (currentField !== field) return '⇅';
    return currentDir === 'asc' ? '↑' : '↓';
  };

  const startItem = data ? page * size + 1 : 0;
  const endItem = data ? Math.min((page + 1) * size, data.totalItems) : 0;

  return (
    <>
      <div className="content-header">
        <h2>💰 Donations</h2>
        <p>View and manage all donations made through the platform</p>
      </div>

      <div className="content-body">
        <div className="donations-section">
          {/* Toolbar */}
          <div className="donations-toolbar">
            <div className="toolbar-left">
              <input
                type="text"
                placeholder="Search by name, email, campaign, or ID..."
                className="search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              
              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              <select
                className="filter-select"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>

              <button className="btn-clear" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>

            {data && (
              <div className="toolbar-right">
                <span className="results-info">
                  Showing {startItem}-{endItem} of {data.totalItems}
                </span>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading donations...</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              {/* Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Donor Name</th>
                      <th>Email</th>
                      <th 
                        className="sortable" 
                        onClick={() => handleSortChange('amount')}
                        title="Click to sort"
                      >
                        Amount {getSortIcon('amount')}
                      </th>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th 
                        className="sortable" 
                        onClick={() => handleSortChange('createdAt')}
                        title="Click to sort"
                      >
                        Date {getSortIcon('createdAt')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((donation) => (
                      <tr key={donation.id}>
                        <td>{donation.donorName || 'Anonymous'}</td>
                        <td>{donation.donorEmail || 'N/A'}</td>
                        <td style={{ fontWeight: 'bold' }}>
                          {formatCurrency(donation.amount || 0, donation.currency || 'eur')}
                        </td>
                        <td>{donation.campaignTitle || 'Unknown Campaign'}</td>
                        <td>
                          <span className={`status-badge ${(donation.status || 'pending').toLowerCase()}`}>
                            {donation.status || 'PENDING'}
                          </span>
                        </td>
                        <td>
                          {donation.createdAt
                            ? new Date(donation.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-controls">
                <button
                  className="btn-pagination"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  ← Previous
                </button>

                <div className="pagination-info">
                  Page {page + 1} of {data.totalPages}
                </div>

                <button
                  className="btn-pagination"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.totalPages - 1}
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No donations found</p>
              {(q || status !== 'ALL') && (
                <button className="btn-clear" onClick={handleClearFilters}>
                  Clear filters to see all donations
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

