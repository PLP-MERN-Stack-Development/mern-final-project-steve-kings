"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

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

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
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

        if (user) {
            fetchData();
        }
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
                                                <Link
                                                    href={`/dashboard/elections/${election._id}`}
                                                    className="text-purple-600 hover:text-purple-900"
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
        </div>
    );
}
