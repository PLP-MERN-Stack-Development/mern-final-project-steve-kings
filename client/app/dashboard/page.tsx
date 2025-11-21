"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Image from 'next/image';

interface Election {
    _id: string;
    title: string;
    organization: string;
    startDate: string;
    endDate: string;
    status: string;
    candidates: any[];
    voters: any[];
}

export default function DashboardPage() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const [elections, setElections] = useState<Election[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }

        // Redirect admins to their own dashboard
        if (!authLoading && user && user.role === 'admin') {
            router.push('/admin-dashboard');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchElections = async () => {
            try {
                const res = await api.get('/elections');
                setElections(res.data);
            } catch (error) {
                console.error('Failed to fetch elections', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchElections();
    }, [user]);

    // Show loading while auth is still loading or redirecting
    if (authLoading || !user) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="spinner-google"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Dashboard Navbar */}
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
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.username}</span>
                            </div>
                            <Link
                                href="/dashboard/profile"
                                className="text-gray-500 hover:text-green-600 transition-colors"
                                title="Profile Settings"
                            >
                                <i className="fas fa-user-cog"></i>
                            </Link>
                            <button
                                onClick={logout}
                                className="text-gray-500 hover:text-red-600 transition-colors"
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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.username}! 🎉</h1>
                        <p className="text-gray-600 mt-1">Ready to create your first election?</p>
                    </div>
                    <Link
                        href="/dashboard/create-election"
                        className="btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Create New Election
                    </Link>
                </div>

                {/* Stats Overview (Placeholder) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 text-sm font-medium">Total Elections</h3>
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <i className="fas fa-poll"></i>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{elections.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 text-sm font-medium">Active Voters</h3>
                            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                <i className="fas fa-users"></i>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 text-sm font-medium">Total Votes</h3>
                            <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                                <i className="fas fa-vote-yea"></i>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">0</div>
                    </div>
                </div>

                {/* Elections List */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Your Elections ({elections.length})</h2>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="spinner-google w-8 h-8"></div>
                        </div>
                    ) : elections.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-clipboard-list text-gray-400 text-3xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No elections yet</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                Get started by selecting a plan and creating your first election.
                            </p>
                            <Link
                                href="/pricing"
                                className="btn-primary"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Create Election
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {elections.map((election) => (
                                <Link key={election._id} href={`/dashboard/elections/${election._id}`} className="block group">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                                        <div className="h-2 bg-green-500 w-full"></div>
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`badge ${election.status === 'active' ? 'badge-success' :
                                                    election.status === 'completed' ? 'badge-info' : 'badge-warning'
                                                    }`}>
                                                    {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(election.startDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                                                {election.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                {election.organization}
                                            </p>
                                            <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                                                <div className="flex items-center">
                                                    <i className="fas fa-users mr-2"></i>
                                                    {election.candidates.length} Candidates
                                                </div>
                                                <div className="flex items-center">
                                                    <i className="fas fa-vote-yea mr-2"></i>
                                                    {election.voters.length} Voters
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        &copy; 2025 PollSync. Developed by kingscreation.co.ke 2025
                    </p>
                </div>
            </footer>
        </div>
    );
}
