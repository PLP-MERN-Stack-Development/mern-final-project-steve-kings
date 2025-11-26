"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardStats {
    totalUsers: number;
    totalElections: number;
    activeElections: number;
    totalVotes: number;
}

interface Transaction {
    _id: string;
    transactionId: string;
    amount: number;
    status: string;
    plan: string;
    userId: { username: string; email: string };
    createdAt: string;
}

const COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export default function AdminDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            console.log('Fetching admin dashboard data...');
            
            const [statsRes, transactionsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/transactions?limit=100')
            ]);

            console.log('Stats:', statsRes.data);
            console.log('Transactions:', transactionsRes.data);

            setStats(statsRes.data);
            setTransactions(transactionsRes.data.transactions || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            alert('Error loading dashboard data. Check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    // Process revenue data for last 7 days
    const getRevenueData = () => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayTransactions = transactions.filter(t => 
                t.status === 'Success' && 
                new Date(t.createdAt).toISOString().split('T')[0] === dateStr
            );
            
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
                transactions: dayTransactions.length
            });
        }
        return last7Days;
    };

    // Process plan distribution
    const getPlanData = () => {
        const planCounts: { [key: string]: { count: number; revenue: number } } = {};
        
        transactions
            .filter(t => t.status === 'Success')
            .forEach(t => {
                const plan = t.plan || 'Unknown';
                if (!planCounts[plan]) {
                    planCounts[plan] = { count: 0, revenue: 0 };
                }
                planCounts[plan].count++;
                planCounts[plan].revenue += t.amount;
            });
        
        return Object.entries(planCounts).map(([plan, data]) => ({
            plan: plan.charAt(0).toUpperCase() + plan.slice(1),
            count: data.count,
            revenue: data.revenue
        }));
    };

    // Calculate totals
    const totalRevenue = transactions
        .filter(t => t.status === 'Success')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const successfulTransactions = transactions.filter(t => t.status === 'Success').length;
    const pendingTransactions = transactions.filter(t => t.status === 'Pending').length;
    const failedTransactions = transactions.filter(t => t.status === 'Failed').length;

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
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <i className="fas fa-chart-line text-white text-sm"></i>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={fetchDashboardData}
                                className="text-gray-600 hover:text-green-600 transition-colors"
                                title="Refresh Dashboard"
                            >
                                <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                            </button>
                            <Link href="/admin/transactions" className="text-gray-600 hover:text-green-600">
                                <i className="fas fa-receipt mr-2"></i>
                                Transactions
                            </Link>
                            <Link href="/admin-dashboard" className="text-gray-600 hover:text-green-600">
                                <i className="fas fa-users-cog mr-2"></i>
                                User Management
                            </Link>
                            <Link href="/dashboard" className="text-gray-600 hover:text-green-600">
                                <i className="fas fa-user mr-2"></i>
                                User View
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="spinner-google w-8 h-8"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-money-bill-wave"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">KES {totalRevenue.toLocaleString()}</div>
                                <p className="text-xs text-green-600 mt-2">
                                    <i className="fas fa-arrow-up mr-1"></i>
                                    From {successfulTransactions} successful payments
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-users"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                                <p className="text-xs text-gray-500 mt-2">Registered users</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Transactions</h3>
                                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-receipt"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{transactions.length}</div>
                                <div className="flex items-center space-x-4 mt-2">
                                    <span className="text-xs text-green-600">{successfulTransactions} success</span>
                                    <span className="text-xs text-yellow-600">{pendingTransactions} pending</span>
                                    <span className="text-xs text-red-600">{failedTransactions} failed</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Elections</h3>
                                    <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-vote-yea"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{stats?.totalElections || 0}</div>
                                <p className="text-xs text-orange-600 mt-2">
                                    {stats?.activeElections || 0} active elections
                                </p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                            {/* Revenue Chart */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend (Last 7 Days)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={getRevenueData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`KES ${value}`, 'Revenue']} />
                                        <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Plan Distribution */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Plan Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={getPlanData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${entry.plan} (${entry.count})`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {getPlanData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [value, 'Purchases']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                                    <Link href="/admin/transactions" className="text-green-600 hover:text-green-700 text-sm font-medium">
                                        View All <i className="fas fa-arrow-right ml-1"></i>
                                    </Link>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {transactions.slice(0, 10).map((tx) => (
                                            <tr key={tx._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-mono text-gray-900">{tx.transactionId}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{tx.userId?.username || 'Guest'}</div>
                                                    <div className="text-sm text-gray-500">{tx.userId?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">KES {tx.amount}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        tx.status === 'Success' ? 'bg-green-100 text-green-800' :
                                                        tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
