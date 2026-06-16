import { useState, useEffect, useCallback } from 'react';
import { authFetch, API_BASE_URL } from '../api';
import { formatDateTime } from '../utils/dateUtils';
import ConfirmDialog from '../components/ConfirmDialog';
import logger from '../utils/logger';
import './Donations.css';

interface ErasureRequest {
  id: string;
  email: string;
  reason: string | null;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface ErasurePageResponse {
  items: ErasureRequest[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export default function AdminErasureRequests() {
  const [data, setData] = useState<ErasurePageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);
  const size = 25;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/admin/erasure-requests?page=${page}&size=${size}`
      );
      if (!response.ok) throw new Error('Failed to load erasure requests');
      const result: ErasurePageResponse = await response.json();
      setData(result);
    } catch (err) {
      logger.error('AdminErasureRequests', 'Error loading erasure requests:', err);
      setError('Failed to load erasure requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleProcess = (id: string, email: string) => {
    setConfirmAction({
      title: 'Process erasure request',
      message: `Are you sure you want to process the erasure request for ${email}?\n\nThis will permanently anonymize all donation records associated with this email. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmAction(null);
        setProcessingId(id);
        try {
          const response = await authFetch(
            `${API_BASE_URL}/admin/erasure-requests/${id}/process`,
            { method: 'POST' }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to process erasure request');
          }
          alert('Erasure request processed successfully. Donor data has been anonymized.');
          await loadRequests();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          logger.error('AdminErasureRequests', 'Process failed:', err);
          alert(`Failed to process erasure request: ${message}`);
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'failed';
      default: return '';
    }
  };

  const startItem = data ? page * size + 1 : 0;
  const endItem = data ? Math.min((page + 1) * size, data.totalItems) : 0;

  return (
    <>
      <div className="content-header" data-testid="erasure-requests-header">
        <h2>Erasure Requests</h2>
        <p>Manage GDPR data erasure requests from donors</p>
      </div>

      <div className="content-body">
        <div className="donations-section">
          {data && data.totalItems > 0 && (
            <div className="donations-toolbar">
              <div className="toolbar-right">
                <span className="results-info">
                  Showing {startItem}-{endItem} of {data.totalItems}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner" data-testid="erasure-requests-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading erasure requests...</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="table-container">
                <table className="data-table" data-testid="erasure-requests-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((request) => (
                      <tr key={request.id} data-testid={`erasure-row-${request.id}`}>
                        <td>{request.email}</td>
                        <td>{request.reason || '-'}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>{formatDateTime(request.createdAt)}</td>
                        <td>
                          {request.status === 'PENDING' ? (
                            <button
                              className="btn-refund"
                              data-testid={`erasure-process-${request.id}`}
                              disabled={processingId === request.id}
                              onClick={() => handleProcess(request.id, request.email)}
                              style={{
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              {processingId === request.id ? 'Processing...' : 'Process'}
                            </button>
                          ) : (
                            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                              {request.processedBy ? `by ${request.processedBy}` : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    className="btn-pagination"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    &larr; Previous
                  </button>
                  <div className="pagination-info">
                    Page {page + 1} of {data.totalPages}
                  </div>
                  <button
                    className="btn-pagination"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.totalPages - 1}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>No erasure requests found</p>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel="Process"
        variant="danger"
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
