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
    createdAt: string;
    updatedAt: string;
}

export default function TransactionsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [verifying, setVerifying] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchTransactions = async () => {
            try {
                const res = await api.get('/payment/my-transactions');
                setTransactions(res.data.transactions || []);
            } catch (error) {
                console.error('Failed to fetch transactions', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [user]);

    if (authLoading || !user) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="spinner-google"></div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
                return 'badge-success';
            case 'pending':
                return 'badge-warning';
            case 'failed':
                return 'badge-error';
            case 'cancelled':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
                return 'fa-check-circle';
            case 'pending':
                return 'fa-clock';
            case 'failed':
                return 'fa-times-circle';
            case 'cancelled':
                return 'fa-ban';
            default:
                return 'fa-question-circle';
        }
    };

    const handleVerifyTransaction = async (transactionId: string) => {
        const confirmed = window.confirm(
            'Verify this transaction with Kopokopo?\n\n' +
            'This will check the payment status and update if completed.'
        );

        if (!confirmed) return;

        setVerifying(transactionId);
        try {
            const response = await api.post('/payment/verify-transaction', {
                transactionId
            });

            if (response.data.success) {
                alert(response.data.message);
                
                // Refresh transactions
                const res = await api.get('/payment/my-transactions');
                setTransactions(res.data.transactions || []);
            } else {
                alert(response.data.message);
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            alert('Failed to verify: ' + (error.response?.data?.message || error.message));
        } finally {
            setVerifying(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/dashboard" className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-vote-yea text-white text-sm"></i>
                                </div>
                                <span className="text-xl font-bold text-gray-900">PollSync</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard"
                                className="text-gray-500 hover:text-green-600 transition-colors"
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
                    <p className="text-gray-600">View all your payment transactions and credit purchases</p>
                </div>

                {/* Transactions List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="spinner-google w-8 h-8"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-receipt text-gray-400 text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions yet</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Purchase a plan to see your transaction history here.
                        </p>
                        <Link href="/pricing" className="btn-primary">
                            <i className="fas fa-shopping-cart mr-2"></i>
                            View Plans
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Transaction ID
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vote Credits
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transactions.map((transaction) => (
                                        <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <i className={`fas ${getStatusIcon(transaction.status)} mr-2 ${
                                                        transaction.status === 'Success' ? 'text-green-500' :
                                                        transaction.status === 'Pending' ? 'text-yellow-500' :
                                                        'text-red-500'
                                                    }`}></i>
                                                    <span className="text-sm font-mono text-gray-900">
                                                        {transaction.transactionId}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900 capitalize">
                                                    {transaction.plan || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {transaction.currency} {transaction.amount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <i className="fas fa-users text-green-600 mr-2"></i>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {transaction.voterLimit === -1 ? 'Unlimited' : transaction.voterLimit}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`badge ${getStatusBadge(transaction.status)}`}>
                                                        {transaction.status}
                                                    </span>
                                                    {transaction.processed && transaction.status === 'Success' && (
                                                        <span className="text-xs text-green-600">
                                                            <i className="fas fa-check mr-1"></i>
                                                            Credited
                                                        </span>
                                                    )}
                                                    {(transaction.status === 'Pending' || transaction.status === 'Failed') && !transaction.processed && (
                                                        <button
                                                            onClick={() => handleVerifyTransaction(transaction.transactionId)}
                                                            disabled={verifying === transaction.transactionId}
                                                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                                            title="Verify with Kopokopo"
                                                        >
                                                            <i className={`fas ${verifying === transaction.transactionId ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-1`}></i>
                                                            {verifying === transaction.transactionId ? 'Verifying...' : 'Verify'}
                                                        </button>
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

                {/* Summary */}
                {transactions.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                                <i className="fas fa-receipt text-purple-600"></i>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-500">Successful Payments</h3>
                                <i className="fas fa-check-circle text-green-600"></i>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {transactions.filter(t => t.status === 'Success').length}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
                                <i className="fas fa-money-bill-wave text-green-600"></i>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                KES {transactions
                                    .filter(t => t.status === 'Success')
                                    .reduce((sum, t) => sum + t.amount, 0)}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
