"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { io } from 'socket.io-client';

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
    phoneNumber?: string;
    createdAt: string;
}

interface Election {
    _id: string;
    title: string;
    organization: string;
    startDate: string;
    endDate: string;
    status: string;
    organizer?: {
        username: string;
        email: string;
    };
}

export default function AdminDashboard() {
    const { user, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalElections: 0,
        activeElections: 0,
        totalUsers: 0,
        totalVotes: 0
    });
    const [elections, setElections] = useState<Election[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'elections' | 'users'>('overview');
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'election', id: string } | null>(null);
    const [selectedElection, setSelectedElection] = useState<string | null>(null);
    const [electionVotes, setElectionVotes] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            // Fetch stats
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);

            // Fetch all elections
            const electionsRes = await api.get('/admin/elections');
            setElections(electionsRes.data);

            // Fetch all users
            const usersRes = await api.get('/admin/users');
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchData();
        }

        // Real-time updates with Socket.IO
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
        
        socket.on('connect', () => {
            console.log('Admin dashboard connected to real-time updates');
        });

        socket.on('newVote', () => {
            console.log('New vote detected, refreshing data...');
            fetchData();
        });

        socket.on('newTransaction', () => {
            console.log('New transaction detected, refreshing data...');
            fetchData();
        });

        socket.on('electionUpdated', () => {
            console.log('Election updated, refreshing data...');
            fetchData();
        });

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, [user, authLoading, router]);

    const handleDeleteUser = async (userId: string) => {
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
            setDeleteConfirm(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleDeleteElection = async (electionId: string) => {
        try {
            await api.delete(`/admin/elections/${electionId}`);
            setElections(elections.filter(e => e._id !== electionId));
            setDeleteConfirm(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete election');
        }
    };

    const handleToggleRole = async (userId: string, currentRole: string) => {
        try {
            const newRole = currentRole === 'admin' ? 'organizer' : 'admin';
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleViewVotes = async (electionId: string) => {
        try {
            const response = await api.get(`/admin/elections/${electionId}/votes`);
            setElectionVotes(response.data);
            setSelectedElection(electionId);
        } catch (error: any) {
            alert('Failed to load votes: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleExportElection = async (electionId: string, electionTitle: string) => {
        try {
            setIsExporting(true);
            const response = await api.get(`/admin/elections/${electionId}/export`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `election-report-${electionTitle.replace(/\s+/g, '-')}-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            alert('✅ Election report exported successfully!');
        } catch (error: any) {
            alert('Failed to export: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportFinancialReport = async () => {
        try {
            setIsExporting(true);
            const response = await api.get('/admin/reports/financial', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `financial-report-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            alert('✅ Financial report downloaded successfully!');
        } catch (error: any) {
            alert('Failed to export report: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsExporting(false);
        }
    };

    const handleBackupData = async () => {
        const confirmed = window.confirm(
            'Download complete system backup?\n\n' +
            'This will include all users, elections, votes, and transactions.'
        );
        
        if (!confirmed) return;

        try {
            setIsExporting(true);
            const response = await api.get('/admin/backup', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pollsync-backup-${Date.now()}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            alert('✅ System backup downloaded successfully!');
        } catch (error: any) {
            alert('Failed to backup data: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsExporting(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="spinner-google"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Admin Navbar */}
            <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 border-b border-purple-700 sticky top-0 z-30 shadow-lg">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/admin-dashboard" className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                    <i className="fas fa-shield-alt text-purple-600 text-sm"></i>
                                </div>
                                <span className="text-xl font-bold text-white">PollSync Admin</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/admin/pricing"
                                className="text-purple-100 hover:text-white transition-colors"
                                title="Manage Pricing"
                            >
                                <i className="fas fa-dollar-sign"></i>
                            </Link>
                            <Link
                                href="/admin/bulk-email"
                                className="text-purple-100 hover:text-white transition-colors"
                                title="Send Bulk Email"
                            >
                                <i className="fas fa-envelope"></i>
                            </Link>
                            <button
                                onClick={fetchData}
                                disabled={isLoading}
                                className="text-purple-100 hover:text-white transition-colors"
                                title="Refresh Dashboard"
                            >
                                <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                            </button>
                            <button
                                onClick={handleExportFinancialReport}
                                disabled={isExporting}
                                className="text-purple-100 hover:text-white transition-colors"
                                title="Export Financial Report"
                            >
                                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
                            </button>
                            <button
                                onClick={handleBackupData}
                                disabled={isExporting}
                                className="text-purple-100 hover:text-white transition-colors"
                                title="Backup System Data"
                            >
                                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                            </button>
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-white hidden md:block">{user?.username}</span>
                                <span className="text-xs bg-yellow-400 text-purple-900 px-2 py-1 rounded-full font-bold">ADMIN</span>
                            </div>
                            <Link
                                href="/dashboard/profile"
                                className="text-purple-100 hover:text-white transition-colors"
                                title="Profile Settings"
                            >
                                <i className="fas fa-user-cog"></i>
                            </Link>
                            <button
                                onClick={logout}
                                className="text-purple-100 hover:text-red-200 transition-colors"
                                title="Logout"
                            >
                                <i className="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* New Dashboard Banner */}
                <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <i className="fas fa-chart-line text-green-600 text-2xl"></i>
                            <div>
                                <h3 className="font-bold text-gray-900">New Revenue Analytics Dashboard Available!</h3>
                                <p className="text-sm text-gray-600">View revenue graphs, transaction analytics, and payment management</p>
                            </div>
                        </div>
                        <Link href="/admin" className="btn-primary whitespace-nowrap">
                            <i className="fas fa-arrow-right mr-2"></i>
                            View Analytics
                        </Link>
                    </div>
                </div>

                {/* Welcome Section */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Welcome back, <span className="text-purple-600">{user?.username}</span>
                    </h1>
                    <p className="text-gray-600 mt-2">Administrator Dashboard - Full System Management</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <i className="fas fa-chart-pie mr-2"></i>
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('elections')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'elections'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <i className="fas fa-vote-yea mr-2"></i>
                            Elections ({elections.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <i className="fas fa-users mr-2"></i>
                            Users ({users.length})
                        </button>
                    </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <i className="fas fa-chart-bar text-3xl opacity-80"></i>
                                    <span className="text-4xl font-bold">{stats.totalElections}</span>
                                </div>
                                <p className="text-purple-100">Total Elections</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <i className="fas fa-check-circle text-3xl opacity-80"></i>
                                    <span className="text-4xl font-bold">{stats.activeElections}</span>
                                </div>
                                <p className="text-green-100">Active Elections</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <i className="fas fa-users text-3xl opacity-80"></i>
                                    <span className="text-4xl font-bold">{stats.totalUsers}</span>
                                </div>
                                <p className="text-blue-100">Total Users</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <i className="fas fa-vote-yea text-3xl opacity-80"></i>
                                    <span className="text-4xl font-bold">{stats.totalVotes}</span>
                                </div>
                                <p className="text-orange-100">Total Votes</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Elections */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Elections</h3>
                                <div className="space-y-3">
                                    {elections.slice(0, 5).map(election => (
                                        <div key={election._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{election.title}</p>
                                                <p className="text-xs text-gray-500">{election.organization}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${election.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {election.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Users */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Users</h3>
                                <div className="space-y-3">
                                    {users.slice(0, 5).map(u => (
                                        <div key={u._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{u.username}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Elections Tab */}
                {activeTab === 'elections' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">All Elections</h2>
                            <p className="text-gray-600 mt-1">Manage all elections across the platform</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Election</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {elections.map(election => (
                                        <tr key={election._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{election.title}</div>
                                                    <div className="text-sm text-gray-500">{election.organization}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {election.organizer?.username || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${election.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : election.status === 'upcoming'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {election.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(election.startDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleViewVotes(election._id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Votes"
                                                >
                                                    <i className="fas fa-chart-bar"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleExportElection(election._id, election.title)}
                                                    disabled={isExporting}
                                                    className="text-green-600 hover:text-green-900 ml-3"
                                                    title="Export to Excel"
                                                >
                                                    <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                                                </button>
                                                <Link
                                                    href={`/dashboard/elections/${election._id}`}
                                                    className="text-purple-600 hover:text-purple-900 ml-3"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'election', id: election._id })}
                                                    className="text-red-600 hover:text-red-900 ml-3"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
                            <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map(u => (
                                        <tr key={u._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{u.username}</div>
                                                        <div className="text-sm text-gray-500">{u.phoneNumber || 'No phone'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleRole(u._id, u.role)}
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 ${u.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                    disabled={u._id === user.id}
                                                >
                                                    {u.role}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'user', id: u._id })}
                                                    className={`text-red-600 hover:text-red-900 ${u._id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    disabled={u._id === user.id}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        &copy; 2025 PollSync. Developed by kingscreation.co.ke 2025
                    </p>
                </div>
            </footer>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirm.type === 'user') {
                                        handleDeleteUser(deleteConfirm.id);
                                    } else {
                                        handleDeleteElection(deleteConfirm.id);
                                    }
                                }}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Election Votes Modal */}
            {selectedElection && electionVotes && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{electionVotes.election.title}</h3>
                                <p className="text-gray-600">Total Votes: {electionVotes.totalVotes}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handleExportElection(selectedElection!, electionVotes.election.title)}
                                    disabled={isExporting}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {isExporting ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Exporting...</>
                                    ) : (
                                        <><i className="fas fa-file-excel mr-2"></i>Export to Excel</>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedElection(null);
                                        setElectionVotes(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <i className="fas fa-times text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Candidates Results */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Results by Candidate</h4>
                                <div className="space-y-4">
                                    {electionVotes.election.candidates
                                        .sort((a: any, b: any) => b.voteCount - a.voteCount)
                                        .map((candidate: any, index: number) => {
                                            const percentage = electionVotes.totalVotes > 0 
                                                ? ((candidate.voteCount / electionVotes.totalVotes) * 100).toFixed(1)
                                                : 0;
                                            return (
                                                <div key={candidate._id} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                                                            <div>
                                                                <h5 className="font-bold text-gray-900">{candidate.candidate.name}</h5>
                                                                <p className="text-sm text-gray-600">{candidate.party || 'Independent'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-purple-600">{candidate.voteCount}</div>
                                                            <div className="text-sm text-gray-600">{percentage}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                                        <div 
                                                            className="bg-purple-600 h-3 rounded-full transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Individual Votes */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Individual Votes</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voter</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {electionVotes.votes.map((vote: any) => (
                                                <tr key={vote._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-gray-900">{vote.voter?.username || 'Anonymous'}</div>
                                                        <div className="text-xs text-gray-500">{vote.voter?.email}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{vote.candidate?.name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {new Date(vote.createdAt).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
