"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Transaction {
    _id: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    plan: string;
    voterLimit: number;
    processed: boolean;
    phoneNumber: string;
    userId: {
        _id: string;
        username: string;
        email: string;
        phoneNumber: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    total: number;
    success: number;
    pending: number;
    failed: number;
    cancelled: number;
    totalRevenue: number;
}

export default function AdminTransactionsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [completing, setCompleting] = useState<string | null>(null);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);
            if (search) params.append('search', search);

            const res = await api.get(`/admin/transactions?${params.toString()}`);
            setTransactions(res.data.transactions || []);
            setStats(res.data.stats);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchTransactions();
        }
    }, [user, filter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTransactions();
    };

    const handleComplete = async (transactionId: string) => {
        const confirmed = window.confirm(
            'Manually complete this transaction?\n\n' +
            'This will mark it as successful and add credits to the user.'
        );

        if (!confirmed) return;

        setCompleting(transactionId);
        try {
            const transaction = transactions.find(t => t._id === transactionId);
            const response = await api.post(`/admin/transactions/${transactionId}/complete`);

            if (response.data.success) {
                alert(`✅ Transaction completed! Credits added to user.`);
                fetchTransactions();
            }
        } catch (error: any) {
            alert('Failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setCompleting(null);
        }
    };

    const handleVerify = async (transactionId: string) => {
        setVerifying(transactionId);
        try {
            const response = await api.post('/payment/verify-transaction', { transactionId });
            alert(response.data.message);
            fetchTransactions();
        } catch (error: any) {
            alert('Failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setVerifying(null);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === transactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(transactions.map(t => t._id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkComplete = async () => {
        if (selectedIds.length === 0) {
            alert('Please select transactions to complete');
            return;
        }

        const confirmed = window.confirm(
            `Mark ${selectedIds.length} transaction(s) as successful?\n\n` +
            'This will add credits to the users for all selected transactions.'
        );

        if (!confirmed) return;

        setBulkProcessing(true);
        try {
            const results = await Promise.allSettled(
                selectedIds.map(id => api.post(`/admin/transactions/${id}/complete`))
            );

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            alert(`✅ Completed ${successful} transaction(s)\n${failed > 0 ? `❌ Failed ${failed} transaction(s)` : ''}`);
            setSelectedIds([]);
            fetchTransactions();
        } catch (error: any) {
            alert('Bulk operation failed: ' + error.message);
        } finally {
            setBulkProcessing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            alert('Please select transactions to delete');
            return;
        }

        const confirmed = window.confirm(
            `⚠️ DELETE ${selectedIds.length} transaction(s)?\n\n` +
            'This action CANNOT be undone!'
        );

        if (!confirmed) return;

        setBulkProcessing(true);
        try {
            const results = await Promise.allSettled(
                selectedIds.map(id => api.delete(`/admin/transactions/${id}`))
            );

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            alert(`✅ Deleted ${successful} transaction(s)\n${failed > 0 ? `❌ Failed ${failed} transaction(s)` : ''}`);
            setSelectedIds([]);
            fetchTransactions();
        } catch (error: any) {
            alert('Bulk delete failed: ' + error.message);
        } finally {
            setBulkProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Success': return 'badge-success';
            case 'Pending': return 'badge-warning';
            case 'Failed': return 'badge-error';
            case 'Cancelled': return 'badge-secondary';
            default: return 'badge-secondary';
        }
    };

    if (authLoading || !user) {
        return <div className="flex justify-center items-center h-screen"><div className="spinner-google"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/admin" className="text-xl font-bold text-gray-900">Admin Panel</Link>
                            <span className="text-gray-400">→</span>
                            <span className="text-gray-600">Transactions</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchTransactions}
                                disabled={isLoading}
                                className="text-gray-600 hover:text-green-600 transition-colors"
                                title="Refresh Transactions"
                            >
                                <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                            </button>
                            <Link href="/admin" className="flex items-center text-gray-600 hover:text-green-600">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
                            <div className="text-sm text-green-600">Success</div>
                            <div className="text-2xl font-bold text-green-700">{stats.success}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                            <div className="text-sm text-yellow-600">Pending</div>
                            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
                            <div className="text-sm text-red-600">Failed</div>
                            <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-sm text-gray-600">Cancelled</div>
                            <div className="text-2xl font-bold text-gray-700">{stats.cancelled}</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                            <div className="text-sm text-blue-600">Revenue</div>
                            <div className="text-2xl font-bold text-blue-700">KES {stats.totalRevenue}</div>
                        </div>
                    </div>
                )}

                {/* Filters and Bulk Actions */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search by transaction ID or phone..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <button type="submit" className="btn-primary">
                                        <i className="fas fa-search mr-2"></i>
                                        Search
                                    </button>
                                </form>
                            </div>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">All Status</option>
                                <option value="Success">Success</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Bulk Actions Bar */}
                        {selectedIds.length > 0 && (
                            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center space-x-3">
                                    <i className="fas fa-check-circle text-blue-600"></i>
                                    <span className="font-medium text-blue-900">{selectedIds.length} selected</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleBulkComplete}
                                        disabled={bulkProcessing}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                                    >
                                        {bulkProcessing ? (
                                            <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
                                        ) : (
                                            <><i className="fas fa-check mr-2"></i>Mark as Success</>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={bulkProcessing}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 text-sm"
                                    >
                                        {bulkProcessing ? (
                                            <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</>
                                        ) : (
                                            <><i className="fas fa-trash mr-2"></i>Delete Selected</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transactions Table */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="spinner-google w-8 h-8"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="bg-white rounded-lg p-12 text-center">
                        <i className="fas fa-receipt text-gray-400 text-4xl mb-4"></i>
                        <p className="text-gray-600">No transactions found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === transactions.length && transactions.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.map((tx) => (
                                        <tr key={tx._id} className={`hover:bg-gray-50 ${selectedIds.includes(tx._id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(tx._id)}
                                                    onChange={() => toggleSelect(tx._id)}
                                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-mono text-gray-900">{tx.transactionId}</div>
                                                <div className="text-xs text-gray-500">{tx.phoneNumber}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {tx.userId ? (
                                                    <div>
                                                        <div className="text-sm font-medium">{tx.userId.username}</div>
                                                        <div className="text-xs text-gray-500">{tx.userId.email}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Guest</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-bold">{tx.currency} {tx.amount}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm capitalize">{tx.plan || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{tx.voterLimit} voters</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`badge ${getStatusBadge(tx.status)}`}>{tx.status}</span>
                                                    {tx.processed && <span className="text-xs text-green-600"><i className="fas fa-check mr-1"></i>Credited</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    {(tx.status === 'Pending' || tx.status === 'Failed') && !tx.processed && (
                                                        <>
                                                            <button
                                                                onClick={() => handleComplete(tx._id)}
                                                                disabled={completing === tx._id}
                                                                className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                                                title="Manually complete"
                                                            >
                                                                {completing === tx._id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                                                            </button>
                                                            <button
                                                                onClick={() => handleVerify(tx.transactionId)}
                                                                disabled={verifying === tx.transactionId}
                                                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                                                                title="Verify with Kopokopo"
                                                            >
                                                                {verifying === tx.transactionId ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
