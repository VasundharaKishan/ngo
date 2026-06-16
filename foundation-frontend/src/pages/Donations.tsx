import { useState, useEffect, useCallback } from 'react';
import { RiMoneyDollarCircleLine, RiDownloadLine } from 'react-icons/ri';
import { formatCurrency } from '../utils/currency';
import { fetchDonationsPaginated, refundDonation, authFetch, API_BASE_URL, type DonationPageResponse } from '../api';
import { usePaginationParams } from '../hooks/usePaginationParams';
import { useDebounce } from '../hooks/useDebounce';
import { formatDateTime } from '../utils/dateUtils';
import { TIMING, API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';
import './Donations.css';

export default function Donations() {
  const [data, setData] = useState<DonationPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const { page, size, sort, q, status, setPage, setSize, setSort, setQuery, setStatus, reset } = usePaginationParams();
  const debouncedSearch = useDebounce(searchInput, TIMING.DEBOUNCE_SEARCH);

  // Update query when debounced search changes
  useEffect(() => {
    setQuery(debouncedSearch);
  }, [debouncedSearch, setQuery]);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDonationsPaginated({ page, size, sort, q, status });
      setData(response);
    } catch (err) {
      logger.error('Donations', 'Error loading donations:', err);
      setError('Failed to load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, size, sort, q, status]);

  // Load donations when filters change
  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const handleRefund = async (donationId: string, donorName: string, amount: number, currency: string) => {
    const formattedAmount = formatCurrency(amount, currency);
    const confirmed = window.confirm(
      `Are you sure you want to refund this donation of ${formattedAmount} to ${donorName}? This cannot be undone.`
    );
    if (!confirmed) return;

    setRefundingId(donationId);
    try {
      await refundDonation(donationId, 'Admin initiated refund');
      alert('Refund processed successfully.');
      await loadDonations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      logger.error('Donations', 'Refund failed:', err);
      alert(`Refund failed: ${message}`);
    } finally {
      setRefundingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    reset();
  };

  const handleDownloadReceipt = async (donationId: string) => {
    try {
      const receiptPath = API_ENDPOINTS.DONATIONS.ADMIN_RECEIPT(donationId);
      const response = await authFetch(`${API_BASE_URL}${receiptPath}`);
      if (!response.ok) {
        throw new Error(`Receipt download failed (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${donationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      logger.error('Donations', 'Receipt download failed:', err);
      alert(`Receipt download failed: ${message}`);
    }
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
      <div className="content-header" data-testid="donations-header">
        <h2><RiMoneyDollarCircleLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Donations</h2>
        <p>View and manage all donations made through the platform</p>
      </div>

      <div className="content-body">
        <div className="donations-section">
          {/* Toolbar */}
          <div className="donations-toolbar">
            <div className="toolbar-left" data-testid="donations-toolbar">
              <input
                type="text"
                placeholder="Search by name, email, campaign, or ID..."
                className="search-input"
                data-testid="donations-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              
              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                data-testid="donations-status-filter"
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              <select
                className="filter-select"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                data-testid="donations-size-select"
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
                <span className="results-info" data-testid="donations-results-info">
                    Showing {startItem}-{endItem} of {data.totalItems}
                  </span>
              </div>
            )}
          </div>

          {/* Error Banner */}
            {error && (
              <div className="error-banner" data-testid="donations-error">
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
                <table className="data-table" data-testid="donations-table">
                  <thead>
                    <tr>
                      <th>Donor Name</th>
                      <th>Email</th>
                      <th 
                        className="sortable" 
                        onClick={() => handleSortChange('amount')}
                        title="Click to sort"
                        data-testid="donations-sort-amount"
                      >
                        Amount {getSortIcon('amount')}
                      </th>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th
                        className="sortable"
                        onClick={() => handleSortChange('createdAt')}
                        title="Click to sort"
                        data-testid="donations-sort-date"
                      >
                        Date {getSortIcon('createdAt')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((donation) => (
                      <tr key={donation.id} data-testid={`donation-row-${donation.id}`}>
                        <td>{donation.donorName || 'Anonymous'}</td>
                        <td>{donation.donorEmail || 'N/A'}</td>
                        <td style={{ fontWeight: 'bold' }}>
                          {formatCurrency(donation.amount || 0, donation.currency || 'eur')}
                        </td>
                        <td>{donation.campaignTitle || 'Unknown Campaign'}</td>
                        <td>
                          <span className={`status-badge ${(donation.status || 'pending').toLowerCase()}`}>
                            <span data-testid={`donation-status-${donation.id}`}>
                              {donation.status || 'PENDING'}
                            </span>
                          </span>
                        </td>
                        <td>
                          {donation.createdAt
                            ? formatDateTime(donation.createdAt)
                            : 'N/A'}
                        </td>
                        <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {(donation.status === 'SUCCESS' || donation.status === 'REFUNDED') && (
                            <button
                              className="btn-icon"
                              data-testid={`receipt-btn-${donation.id}`}
                              title="Download Receipt (PDF)"
                              onClick={() => handleDownloadReceipt(donation.id)}
                              style={{
                                background: 'none',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '0.35rem 0.5rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: '#475569',
                              }}
                            >
                              <RiDownloadLine />
                            </button>
                          )}
                          {donation.status === 'SUCCESS' && (
                            <button
                              className="btn-refund"
                              data-testid={`refund-btn-${donation.id}`}
                              disabled={refundingId === donation.id}
                              onClick={() => handleRefund(
                                donation.id,
                                donation.donorName || 'Anonymous',
                                donation.amount || 0,
                                donation.currency || 'eur'
                              )}
                            >
                              {refundingId === donation.id ? 'Refunding...' : 'Refund'}
                            </button>
                          )}
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
                  data-testid="donations-prev"
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
                  data-testid="donations-next"
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
