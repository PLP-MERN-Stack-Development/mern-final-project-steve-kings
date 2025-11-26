"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { io } from 'socket.io-client';

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

interface CreditStatus {
    electionPackages: {
        total: number;
        available: number;
        used: number;
    };
    message: string;
}

export default function DashboardPage() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const [elections, setElections] = useState<Election[]>([]);
    const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [stats, setStats] = useState({
        activeElections: 0,
        completedElections: 0,
        totalVotes: 0,
        recentActivity: [] as any[]
    });
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

    // Fetch data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [electionsRes, creditsRes] = await Promise.all([
                    api.get('/elections'),
                    api.get('/auth/credits/realtime') // Use realtime endpoint
                ]);
                
                const electionsData = electionsRes.data;
                setElections(electionsData);
                setCreditStatus(creditsRes.data);
                
                console.log('📊 Real-time credits:', creditsRes.data);
                
                // Calculate stats
                const active = electionsData.filter((e: Election) => e.status === 'active').length;
                const completed = electionsData.filter((e: Election) => e.status === 'completed').length;
                const totalVotes = electionsData.reduce((acc: number, curr: Election) => acc + (curr.voters?.length || 0), 0);
                
                setStats({
                    activeElections: active,
                    completedElections: completed,
                    totalVotes,
                    recentActivity: electionsData.slice(0, 5)
                });
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Socket.io for real-time updates
    useEffect(() => {
        if (!user) return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('✅ Dashboard connected:', socket.id);
            setIsConnected(true);
            socket.emit('join_room', (user as any)._id);
        });

        socket.on('disconnect', () => {
            console.log('❌ Dashboard disconnected');
            setIsConnected(false);
        });

        // Payment success
        socket.on('payment_success', async (data: any) => {
            console.log('💳 Payment success:', data);
            const voterLimit = data.voterLimit === -1 ? 'Unlimited' : data.voterLimit;
            showNotification(`✅ Payment successful! ${data.plan} package (${voterLimit} voters)`);
            
            // Refresh with realtime endpoint
            const creditsRes = await api.get('/auth/credits/realtime');
            setCreditStatus(creditsRes.data);
        });

        // Credit updates (when vote is cast)
        socket.on('credits_updated', async (data: any) => {
            console.log('💰 Credits updated:', data);
            
            if (data.reason === 'vote_cast') {
                showNotification(`🗳️ Vote cast in "${data.electionTitle}" - 1 credit used`);
            } else {
                showNotification('💰 Your credits have been updated');
            }
            
            // Refresh with realtime endpoint
            const creditsRes = await api.get('/auth/credits/realtime');
            setCreditStatus(creditsRes.data);
        });

        // New vote cast
        socket.on('newVote', async (data: any) => {
            console.log('🗳️ New vote cast:', data);
            
            // Refresh elections and credits
            const [electionsRes, creditsRes] = await Promise.all([
                api.get('/elections'),
                api.get('/auth/credits/realtime')
            ]);
            
            setElections(electionsRes.data);
            setCreditStatus(creditsRes.data);
            
            // Update stats
            const totalVotes = electionsRes.data.reduce((acc: number, curr: Election) => 
                acc + (curr.voters?.length || 0), 0
            );
            setStats(prev => ({ ...prev, totalVotes }));
        });

        // Election updated
        socket.on('electionUpdated', async (data: any) => {
            console.log('📊 Election updated:', data);
            
            // Refresh elections
            const electionsRes = await api.get('/elections');
            setElections(electionsRes.data);
        });

        return () => {
            socket.close();
        };
    }, [user]);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 5000);
    };

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
                            {/* Real-time connection indicator */}
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                <span className="text-xs text-gray-500 hidden md:block">
                                    {isConnected ? 'Live' : 'Offline'}
                                </span>
                            </div>
                            
                            {/* Refresh button */}
                            <button
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        const [electionsRes, creditsRes] = await Promise.all([
                                            api.get('/elections'),
                                            api.get('/auth/credits/realtime')
                                        ]);
                                        setElections(electionsRes.data);
                                        setCreditStatus(creditsRes.data);
                                        showNotification('✅ Dashboard refreshed');
                                    } catch (error) {
                                        showNotification('❌ Failed to refresh');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="text-gray-500 hover:text-green-600 transition-colors"
                                title="Refresh Dashboard"
                            >
                                <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                            </button>
                            
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.username}</span>
                            </div>
                            <Link
                                href="/dashboard/organizations"
                                className="text-gray-500 hover:text-green-600 transition-colors"
                                title="Organizations"
                            >
                                <i className="fas fa-building"></i>
                            </Link>
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
                {/* Real-time Notification */}
                {notification && (
                    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
                        <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-sm">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-check-circle text-green-500 text-xl"></i>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{notification}</p>
                                <button
                                    onClick={() => setNotification(null)}
                                    className="ml-auto text-gray-400 hover:text-gray-600"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.username}! 👋</h1>
                        <p className="text-gray-600 mt-1">
                            {stats.activeElections > 0 
                                ? `You have ${stats.activeElections} active election${stats.activeElections > 1 ? 's' : ''}`
                                : 'Ready to create your first election?'}
                        </p>
                    </div>
                    <Link
                        href="/dashboard/create-election"
                        className="btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Create New Election
                    </Link>
                </div>

                {/* Vote Credits Banner */}
                {creditStatus && (
                    <div className={`mb-6 p-6 rounded-xl shadow-sm border-2 ${
                        creditStatus.electionPackages.available === 0 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-green-50 border-green-200'
                    }`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                    creditStatus.electionPackages.available === 0 
                                        ? 'bg-red-100 text-red-600' 
                                        : 'bg-green-100 text-green-600'
                                }`}>
                                    <i className="fas fa-box text-2xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Election Packages</h3>
                                    <p className="text-sm text-gray-600">{creditStatus.message}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-center">
                                    <div className={`text-4xl font-bold ${
                                        creditStatus.electionPackages.available === 0 
                                            ? 'text-red-600' 
                                            : 'text-green-600'
                                    }`}>
                                        {creditStatus.electionPackages.available}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Available Packages</div>
                                </div>
                                {creditStatus.electionPackages.available === 0 && (
                                    <Link
                                        href="/pricing"
                                        className="px-6 py-3 rounded-lg font-semibold transition-all bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <i className="fas fa-plus mr-2"></i>
                                        Buy Package
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* Total Elections */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-all transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-blue-700 text-sm font-semibold">Total Elections</h3>
                            <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <i className="fas fa-poll text-xl"></i>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-blue-900 mb-2">{elections.length}</div>
                        <div className="flex items-center text-xs text-blue-600">
                            <span className="bg-blue-200 px-2 py-1 rounded-full mr-2">{stats.activeElections} active</span>
                            <span className="bg-blue-200 px-2 py-1 rounded-full">{stats.completedElections} completed</span>
                        </div>
                    </div>

                    {/* Available Packages */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-all transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-green-700 text-sm font-semibold">Available Packages</h3>
                            <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <i className="fas fa-box text-xl"></i>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-green-900 mb-2">
                            {creditStatus?.electionPackages.available || 0}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-green-600">Ready to use</p>
                            <Link 
                                href="/pricing" 
                                className="text-xs font-semibold text-green-700 hover:text-green-800 bg-green-200 px-3 py-1 rounded-full hover:bg-green-300 transition-colors"
                            >
                                <i className="fas fa-plus mr-1"></i>
                                Buy More
                            </Link>
                        </div>
                    </div>

                    {/* Transactions */}
                    <Link href="/dashboard/transactions" className="block group">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200 hover:shadow-md transition-all transform hover:-translate-y-1 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-purple-700 text-sm font-semibold">Transactions</h3>
                                <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <i className="fas fa-receipt text-xl"></i>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-purple-900 mb-2">
                                {creditStatus?.electionPackages.total || 0}
                            </div>
                            <p className="text-xs text-purple-600 group-hover:text-purple-700">
                                View history <i className="fas fa-arrow-right ml-1"></i>
                            </p>
                        </div>
                    </Link>

                    {/* Total Votes */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition-all transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-orange-700 text-sm font-semibold">Total Votes</h3>
                            <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <i className="fas fa-vote-yea text-xl"></i>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-orange-900 mb-2">
                            {stats.totalVotes}
                        </div>
                        <p className="text-xs text-orange-600">
                            {stats.totalVotes > 0 ? 'Votes cast across all elections' : 'No votes yet'}
                        </p>
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
                                <div key={election._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                                    <div className="h-2 bg-green-500 w-full"></div>
                                    <div className="p-6 flex-1 flex flex-col">
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
                                        <Link href={`/dashboard/elections/${election._id}`} className="block group">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                                                {election.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {election.organization}
                                        </p>
                                        
                                        {/* Package/Credits Used Display */}
                                        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-xs text-green-600 font-medium mb-1">
                                                        {(election as any).packages && (election as any).packages.length > 1 
                                                            ? `${(election as any).packages.length} Packages` 
                                                            : 'Package Used'}
                                                    </p>
                                                    <p className="text-base font-bold text-green-900 capitalize">
                                                        {(election as any).packages && (election as any).packages.length > 0
                                                            ? (election as any).packages.map((p: any) => p.packageName).join(' + ')
                                                            : (election as any).packageUsed || election.planType || 'Free'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-green-600 font-medium mb-1">Total Credits</p>
                                                    <p className="text-base font-bold text-green-900">
                                                        {(election as any).totalCredits 
                                                            ? ((election as any).totalCredits >= 999999 ? '∞' : (election as any).totalCredits)
                                                            : ((election as any).creditsUsed || (election.voterLimit === -1 ? '∞' : election.voterLimit))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <div className="flex items-center">
                                                <i className="fas fa-users mr-2"></i>
                                                {election.candidates.length} Candidates
                                            </div>
                                            <div className="flex items-center">
                                                <i className="fas fa-vote-yea mr-2"></i>
                                                {election.voters.length} Voters
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                                            <Link 
                                                href={`/dashboard/elections/${election._id}`}
                                                className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                            >
                                                <i className="fas fa-eye mr-2"></i>
                                                View
                                            </Link>
                                            <Link 
                                                href={`/dashboard/elections/${election._id}?tab=analytics`}
                                                className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                            >
                                                <i className="fas fa-chart-line mr-2"></i>
                                                Analytics
                                            </Link>
                                        </div>
                                    </div>
                                </div>
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
