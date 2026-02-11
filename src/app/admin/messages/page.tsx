'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, getAuthClient } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { logAdminAction } from '@/lib/audit-log';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  status: string;
  read: boolean;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  order: 'Order Support',
  returns: 'Returns & Exchanges',
  partnership: 'Partnership',
  press: 'Press & Media',
  other: 'Other',
};

function formatDate(ts: string | undefined): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function timeAgo(ts: string | undefined): string {
  if (!ts) return '';
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(ts);
  } catch {
    return '';
  }
}

export default function AdminMessagesPage() {
  const getAdminEmail = () => {
    const auth = getAuthClient();
    return auth?.currentUser?.email || 'unknown';
  };

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const q = query(collection(db, 'contact_messages'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => {
          const raw = d.data();
          let ts = '';
          if (raw.timestamp instanceof Timestamp) {
            ts = raw.timestamp.toDate().toISOString();
          } else if (raw.timestamp) {
            ts = String(raw.timestamp);
          }
          return {
            id: d.id,
            name: raw.name || '',
            email: raw.email || '',
            subject: raw.subject || 'general',
            message: raw.message || '',
            timestamp: ts,
            status: raw.status || 'new',
            read: raw.read === true,
          } as ContactMessage;
        });
        setMessages(data);
      } catch (err) {
        console.error('Error fetching contact messages:', err);
      }
      setLoading(false);
    };
    fetchMessages();
  }, []);

  // Filtered + searched messages
  const filtered = useMemo(() => {
    let result = messages;
    if (filter === 'unread') result = result.filter((m) => !m.read);
    if (filter === 'read') result = result.filter((m) => m.read);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [messages, filter, searchQuery]);

  const totalCount = messages.length;
  const unreadCount = messages.filter((m) => !m.read).length;

  // Toggle read/unread
  const toggleRead = async (msg: ContactMessage) => {
    setActionLoading(true);
    try {
      const newRead = !msg.read;
      await updateDoc(doc(db, 'contact_messages', msg.id), { read: newRead });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: newRead } : m)));
    } catch (err) {
      console.error('Error toggling read status:', err);
    }
    setActionLoading(false);
  };

  // Delete single message
  const deleteMessage = async (id: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
      logAdminAction('message_deleted', { messageId: id }, getAdminEmail());
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
    setShowDeleteConfirm(null);
    setActionLoading(false);
  };

  // Mark all as read
  const markAllRead = async () => {
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      const unread = messages.filter((m) => !m.read);
      unread.forEach((m) => {
        batch.update(doc(db, 'contact_messages', m.id), { read: true });
      });
      await batch.commit();
      setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
    setActionLoading(false);
  };

  // Bulk delete selected
  const bulkDelete = async () => {
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.delete(doc(db, 'contact_messages', id));
      });
      await batch.commit();
      logAdminAction('bulk_delete', { type: 'messages', count: selectedIds.size }, getAdminEmail());
      setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      if (expandedId && selectedIds.has(expandedId)) setExpandedId(null);
    } catch (err) {
      console.error('Error bulk deleting messages:', err);
    }
    setShowBulkDeleteConfirm(false);
    setActionLoading(false);
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm tracking-wider">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-bebas tracking-wider">MESSAGES</h2>
          <p className="text-white/25 text-sm mt-1">
            Contact form submissions · {totalCount} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={actionLoading}
              className="btn-premium px-4 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-xs tracking-wider uppercase hover:bg-white/[0.1] transition-colors disabled:opacity-50"
            >
              Mark All Read
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={actionLoading}
              className="btn-premium px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs tracking-wider uppercase text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              Delete ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Total</p>
          <p className="text-2xl font-bebas">{totalCount}</p>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Unread</p>
          <p className={`text-2xl font-bebas ${unreadCount > 0 ? 'text-amber-400' : ''}`}>{unreadCount}</p>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl hidden sm:block">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Read</p>
          <p className="text-2xl font-bebas text-white/40">{totalCount - unreadCount}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">⌕</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or message..."
            className="input-premium w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 rounded-xl text-xs tracking-wider uppercase transition-all ${
                filter === f
                  ? 'bg-white text-black font-medium'
                  : 'bg-white/[0.03] border border-white/[0.08] text-white/40 hover:text-white/60 hover:bg-white/[0.06]'
              }`}
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  filter === f ? 'bg-black/20 text-black' : 'bg-amber-500/80 text-white'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <span className="text-4xl block mb-4 opacity-20">✉</span>
          <h3 className="text-xl font-bebas tracking-wider mb-2">
            {searchQuery || filter !== 'all' ? 'No Messages Found' : 'No Messages Yet'}
          </h3>
          <p className="text-white/25 text-sm">
            {searchQuery
              ? 'Try adjusting your search or filter'
              : 'Contact form submissions will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-3 px-4 py-2">
            <button
              onClick={toggleSelectAll}
              className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                selectedIds.size === filtered.length && filtered.length > 0
                  ? 'bg-white border-white text-black'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {selectedIds.size === filtered.length && filtered.length > 0 && (
                <span className="text-xs">✓</span>
              )}
            </button>
            <span className="text-white/20 text-xs tracking-wider uppercase">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : `${filtered.length} message${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {filtered.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const isSelected = selectedIds.has(msg.id);

            return (
              <div
                key={msg.id}
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  !msg.read
                    ? 'bg-white/[0.04] border-white/[0.12]'
                    : 'bg-white/[0.01] border-white/[0.06]'
                } ${isSelected ? 'ring-1 ring-white/20' : ''}`}
              >
                {/* Message Row */}
                <div
                  className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : msg.id);
                    // Auto-mark as read when expanding
                    if (!isExpanded && !msg.read) {
                      updateDoc(doc(db, 'contact_messages', msg.id), { read: true }).catch(() => {});
                      setMessages((prev) =>
                        prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
                      );
                    }
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(msg.id);
                    }}
                    className={`w-5 h-5 rounded border transition-colors flex-shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'bg-white border-white text-black'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>

                  {/* Unread dot */}
                  <div className="w-2 flex-shrink-0">
                    {!msg.read && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                  </div>

                  {/* Name + Email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${!msg.read ? 'font-semibold text-white' : 'text-white/70'}`}>
                        {msg.name}
                      </p>
                      <span className="text-white/15 text-xs hidden sm:inline">·</span>
                      <p className="text-xs text-white/30 truncate hidden sm:block">{msg.email}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        !msg.read
                          ? 'bg-white/10 text-white/60'
                          : 'bg-white/[0.04] text-white/25'
                      }`}>
                        {SUBJECT_LABELS[msg.subject] || msg.subject}
                      </span>
                      <p className="text-xs text-white/20 truncate hidden md:block">
                        {msg.message.length > 60 ? msg.message.slice(0, 60) + '...' : msg.message}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <p className="text-xs text-white/20 flex-shrink-0 hidden sm:block">
                    {timeAgo(msg.timestamp)}
                  </p>

                  {/* Expand chevron */}
                  <span
                    className={`text-white/20 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 border-t border-white/[0.06]">
                    <div className="grid sm:grid-cols-2 gap-4 mb-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">From</p>
                        <p className="text-sm font-medium">{msg.name}</p>
                        <p className="text-sm text-white/40">{msg.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Received</p>
                        <p className="text-sm text-white/60">{formatDate(msg.timestamp)}</p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Subject</p>
                      <p className="text-sm text-white/70">{SUBJECT_LABELS[msg.subject] || msg.subject}</p>
                    </div>

                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Message</p>
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                        <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(
                          SUBJECT_LABELS[msg.subject] || msg.subject
                        )} — DYMNDS`}
                        className="btn-premium px-5 py-2.5 bg-white text-black text-xs tracking-wider uppercase rounded-xl hover:bg-white/90 transition-colors"
                      >
                        Reply
                      </a>
                      <button
                        onClick={() => toggleRead(msg)}
                        disabled={actionLoading}
                        className="btn-premium px-5 py-2.5 bg-white/[0.06] border border-white/[0.1] text-xs tracking-wider uppercase rounded-xl hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                      >
                        Mark as {msg.read ? 'Unread' : 'Read'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(msg.id)}
                        disabled={actionLoading}
                        className="btn-premium px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs tracking-wider uppercase rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="modal-panel bg-neutral-950 border border-white/[0.08] rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bebas tracking-wider mb-2">Delete Message?</h3>
            <p className="text-white/40 text-sm mb-6">
              This will permanently delete this message. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm hover:bg-white/[0.1] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMessage(showDeleteConfirm)}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="modal-panel bg-neutral-950 border border-white/[0.08] rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bebas tracking-wider mb-2">Delete {selectedIds.size} Messages?</h3>
            <p className="text-white/40 text-sm mb-6">
              This will permanently delete all selected messages. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm hover:bg-white/[0.1] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
