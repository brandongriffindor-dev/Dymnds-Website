'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, getAuthClient } from '@/lib/firebase';
import { logAdminAction } from '@/lib/audit-log';

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  signed_up_date: string;
  created_at?: string;
}

export default function WaitlistPage() {
  const getAdminEmail = () => {
    const auth = getAuthClient();
    return auth?.currentUser?.email || 'unknown';
  };

  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const setWaitlistData = (data: WaitlistEntry[]) => {
    setWaitlistEntries(data);
  };

  useEffect(() => {
    const fetchWaitlist = async () => {
      try {
        const waitlistSnapshot = await getDocs(collection(db, 'app_waitlist'));
        const waitlistData = waitlistSnapshot.docs
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as WaitlistEntry
          )
          .sort((a, b) => {
            const dateA = new Date(a.signed_up_date);
            const dateB = new Date(b.signed_up_date);
            return dateB.getTime() - dateA.getTime();
          });

        setWaitlistData(waitlistData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching waitlist:', error);
        setLoading(false);
      }
    };

    fetchWaitlist();
  }, []);

  const getWeekAgoDate = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return weekAgo;
  };

  const thisWeekCount = waitlistEntries.filter((entry) => {
    const entryDate = new Date(entry.signed_up_date);
    return entryDate >= getWeekAgoDate();
  }).length;

  const homepageCount = waitlistEntries.filter((entry) =>
    entry.source?.toLowerCase().includes('homepage') ||
    entry.source?.toLowerCase().includes('home')
  ).length;

  const formatDate = (date: string): string => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString();
  };

  const getSourceBadgeColor = (source: string) => {
    const sourceLower = source?.toLowerCase() || '';
    if (sourceLower.includes('homepage') || sourceLower.includes('home')) {
      return 'bg-blue-500/[0.2] text-blue-300';
    }
    if (sourceLower.includes('instagram') || sourceLower.includes('social')) {
      return 'bg-purple-500/[0.2] text-purple-300';
    }
    if (sourceLower.includes('email') || sourceLower.includes('newsletter')) {
      return 'bg-green-500/[0.2] text-green-300';
    }
    return 'bg-white/[0.1] text-white';
  };

  const handleExportCSV = () => {
    logAdminAction('waitlist_exported', {
      count: waitlistEntries.length
    }, getAdminEmail());

    const headers = ['Email', 'Source', 'Signed Up Date'];
    const rows = waitlistEntries.map((entry) => [
      entry.email,
      entry.source,
      formatDate(entry.signed_up_date),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `waitlist_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading waitlist...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bebas text-white mb-8">Waitlist</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Total Signups</p>
            <p className="text-4xl font-bebas text-white">{waitlistEntries.length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">This Week</p>
            <p className="text-4xl font-bebas text-white">{thisWeekCount}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Homepage Signups</p>
            <p className="text-4xl font-bebas text-white">{homepageCount}</p>
          </div>
        </div>

        {/* Export Button */}
        <div className="mb-6">
          <button
            onClick={handleExportCSV}
            className="btn-premium bg-white text-black hover:bg-white/[0.9]"
          >
            Export to CSV
          </button>
        </div>

        {/* Waitlist Table */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-2xl font-bebas text-white mb-6">Waitlist Entries</h2>

          {waitlistEntries.length === 0 ? (
            <p className="text-white/[0.6] text-center py-8">No waitlist entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-4 text-white/[0.6]">Email</th>
                    <th className="text-left py-3 px-4 text-white/[0.6]">Source</th>
                    <th className="text-left py-3 px-4 text-white/[0.6]">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                      <td className="py-4 px-4">
                        <a
                          href={`mailto:${entry.email}`}
                          className="text-white hover:text-white/[0.8] underline"
                        >
                          {entry.email}
                        </a>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(entry.source)}`}
                        >
                          {entry.source || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white/[0.7]">
                        {formatDate(entry.signed_up_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
