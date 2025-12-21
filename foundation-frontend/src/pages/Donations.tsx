import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import { API_BASE_URL } from '../api';

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  campaignTitle: string;
  status: string;
  createdAt: string;
}

export default function Donations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/donations`);
      const data = await res.json();
      setDonations(data);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h2>💰 Donations</h2>
        <p>View all donations made through the platform</p>
      </div>

      <div className="content-body">
        <div className="donations-section">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading donations...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Email</th>
                    <th>Amount</th>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        No donations found
                      </td>
                    </tr>
                  ) : (
                    donations.map((donation) => (
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
                        <td>{donation.createdAt ? new Date(donation.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
