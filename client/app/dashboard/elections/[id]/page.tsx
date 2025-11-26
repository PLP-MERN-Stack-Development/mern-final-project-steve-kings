"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Candidate {
    _id: string;
    name: string;
    position: string;
    photoUrl: string;
    voteCount: number;
}

interface ElectionPackage {
    packageName: string;
    credits: number;
    transactionId: string;
    addedDate: string;
}

interface Election {
    _id: string;
    title: string;
    organization: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
    candidates: Candidate[];
    voters: any[];
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    planType?: string;
    voterLimit?: number;
    packages?: ElectionPackage[];
    totalCredits?: number;
    hasUnlimitedCredits?: boolean;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function ElectionDetailsContent({ id }: { id: string }) {
    const router = useRouter();
    const [election, setElection] = useState<Election | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [voteHistory, setVoteHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'voters'>('overview');
    const [allowedVoters, setAllowedVoters] = useState<any[]>([]);
    const [showAddVoter, setShowAddVoter] = useState(false);
    const [newVoters, setNewVoters] = useState<Array<{ studentId: string; name: string; email: string }>>([
        { studentId: '', name: '', email: '' }
    ]);
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        contactPerson: '',
        contactEmail: '',
        contactPhone: ''
    });
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<string>('');

    // Read tab from URL on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            
            if (tabParam === 'analytics') {
                setActiveTab('analytics');
            } else if (tabParam === 'voters') {
                setActiveTab('voters');
            } else if (tabParam === 'overview') {
                setActiveTab('overview');
            }
        }
    }, []);

    useEffect(() => {
        const fetchElection = async () => {
            try {
                const res = await api.get(`/elections/${id}`);
                setElection(res.data);
                
                // Simulate vote history
                const history = generateVoteHistory(res.data.candidates);
                setVoteHistory(history);
            } catch (error) {
                console.error('Failed to fetch election', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchElection();
    }, [id]);

    useEffect(() => {
        if (id) {
            api.get(`/elections/${id}/voters`)
                .then(res => setAllowedVoters(res.data))
                .catch(err => console.error(err));
        }
    }, [id]);

    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join_election', id);
        });

        socket.on('disconnect', () => setIsConnected(false));

        socket.on('vote_update', (data) => {
            setElection(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    candidates: data.candidates,
                    voters: new Array(data.totalVotes)
                };
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [id]);

    const generateVoteHistory = (candidates: Candidate[]) => {
        const history = [];
        const hours = 24;
        for (let i = 0; i < hours; i++) {
            const entry: any = { time: `${i}:00` };
            candidates.forEach(c => {
                entry[c.name] = Math.floor(Math.random() * (c.voteCount / hours + 5));
            });
            history.push(entry);
        }
        return history;
    };

    const copyToClipboard = () => {
        const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/vote/${id}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

    const fetchAvailablePackages = async () => {
        try {
            const res = await api.get('/auth/credits');
            setAvailablePackages(res.data.availablePackages || []);
        } catch (error) {
            console.error('Failed to fetch available packages', error);
        }
    };

    const handleAddPackage = async () => {
        if (!selectedPackage) {
            alert('Please select a package');
            return;
        }

        try {
            const res = await api.post(`/elections/${id}/add-package`, {
                packageId: selectedPackage
            });

            if (res.data.success) {
                alert('Package added successfully!');
                setShowTopUpModal(false);
                setSelectedPackage('');
                // Refresh election data
                const electionRes = await api.get(`/elections/${id}`);
                setElection(electionRes.data);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add package');
        }
    };

    const openTopUpModal = () => {
        fetchAvailablePackages();
        setShowTopUpModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="spinner-google"></div>
            </div>
        );
    }

    if (!election) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Election not found</h2>
                    <Link href="/dashboard" className="text-green-600 hover:underline mt-4 inline-block">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const totalVotes = election.candidates.reduce((acc, curr) => acc + curr.voteCount, 0);
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/vote/${election._id}`;

    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    let status = 'upcoming';
    let timeRemaining = '';
    
    if (now >= startDate && now <= endDate) {
        status = 'active';
        const diff = endDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timeRemaining = days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`;
    } else if (now > endDate) {
        status = 'completed';
        timeRemaining = 'Election ended';
    } else {
        const diff = startDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        timeRemaining = `Starts in ${days} days`;
    }

    const sortedCandidates = [...election.candidates].sort((a, b) => b.voteCount - a.voteCount);
    const winner = sortedCandidates[0];
    const runnerUp = sortedCandidates[1];

    // Prepare chart data
    const pieData = election.candidates.map(c => ({
        name: c.name,
        value: c.voteCount
    }));

    const barData = election.candidates.map(c => ({
        name: c.name.split(' ')[0],
        votes: c.voteCount,
        percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0
    }));

    const handleTabChange = (tab: 'overview' | 'analytics' | 'voters') => {
        setActiveTab(tab);
        const url = tab === 'overview' 
            ? `/dashboard/elections/${id}` 
            : `/dashboard/elections/${id}?tab=${tab}`;
        router.push(url);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-600 hover:text-green-600">
                                <i className="fas fa-arrow-left"></i>
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">{election.title}</h1>
                                <p className="text-xs text-gray-500">{election.organization}</p>
                            </div>
                            {/* Package/Credits Badge */}
                            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                <div>
                                    <p className="text-xs text-green-600 font-medium">
                                        {(election as any).packages && (election as any).packages.length > 1 
                                            ? `${(election as any).packages.length} Packages` 
                                            : 'Package'}
                                    </p>
                                    <p className="text-sm font-bold text-green-900 capitalize">
                                        {(election as any).packages && (election as any).packages.length > 0
                                            ? (election as any).packages.length === 1
                                                ? (election as any).packages[0].packageName
                                                : 'Multiple'
                                            : ((election as any).packageUsed || election.planType || 'Free')}
                                    </p>
                                </div>
                                <div className="border-l border-green-300 pl-2">
                                    <p className="text-xs text-green-600 font-medium">Total Credits</p>
                                    <p className="text-sm font-bold text-green-900">
                                        {(election as any).totalCredits 
                                            ? ((election as any).totalCredits >= 999999 ? '∞' : (election as any).totalCredits)
                                            : ((election as any).creditsUsed || (election.voterLimit === -1 ? '∞' : election.voterLimit))}
                                    </p>
                                </div>
                                <button
                                    onClick={openTopUpModal}
                                    className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                    title="Add more credits"
                                >
                                    <i className="fas fa-plus mr-1"></i>
                                    Add Package
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                <span className="text-xs text-gray-500 hidden md:block">
                                    {isConnected ? 'Live' : 'Offline'}
                                </span>
                            </div>
                            
                            <button
                                onClick={() => window.location.reload()}
                                className="text-gray-600 hover:text-green-600"
                                title="Refresh"
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                            
                            <button
                                onClick={() => handleTabChange('analytics')}
                                className="btn-secondary text-sm py-2"
                            >
                                <i className="fas fa-chart-line mr-2"></i>
                                <span className="hidden md:inline">Analytics</span>
                            </button>
                            
                            <Link href={`/dashboard/elections/${id}/edit`} className="btn-secondary text-sm py-2">
                                <i className="fas fa-edit mr-2"></i>
                                <span className="hidden md:inline">Edit</span>
                            </Link>
                            
                            <button onClick={copyToClipboard} className="btn-primary text-sm py-2">
                                <i className="fas fa-share-alt mr-2"></i>
                                <span className="hidden md:inline">Share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Banner */}
                <div className={`mb-8 p-6 rounded-xl border-2 ${
                    status === 'active' ? 'bg-green-50 border-green-200' :
                    status === 'completed' ? 'bg-blue-50 border-blue-200' :
                    'bg-yellow-50 border-yellow-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                status === 'active' ? 'bg-green-100 text-green-600' :
                                status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                'bg-yellow-100 text-yellow-600'
                            }`}>
                                <i className={`fas ${
                                    status === 'active' ? 'fa-play-circle' :
                                    status === 'completed' ? 'fa-check-circle' :
                                    'fa-clock'
                                } text-2xl`}></i>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 capitalize">{status}</h2>
                                <p className="text-gray-600">{timeRemaining}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold text-gray-900">{totalVotes}</div>
                            <p className="text-sm text-gray-600">Total Votes Cast</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => handleTabChange('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'overview'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <i className="fas fa-chart-bar mr-2"></i>
                            Overview
                        </button>
                        <button
                            onClick={() => handleTabChange('analytics')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'analytics'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <i className="fas fa-chart-line mr-2"></i>
                            Analytics
                        </button>
                        <button
                            onClick={() => handleTabChange('voters')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'voters'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <i className="fas fa-users mr-2"></i>
                            Voters
                        </button>
                    </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Contact Information Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-phone-alt text-white"></i>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Inquiry Contact Information</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setContactInfo({
                                            contactPerson: election.contactPerson || '',
                                            contactEmail: election.contactEmail || '',
                                            contactPhone: election.contactPhone || ''
                                        });
                                        setShowContactForm(true);
                                    }}
                                    className="btn-secondary text-sm py-2"
                                >
                                    <i className="fas fa-edit mr-2"></i>
                                    Edit Contact Info
                                </button>
                            </div>

                            {/* Contact Form Modal */}
                            {showContactForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Contact Information</h3>
                                        <form onSubmit={async (e) => {
                                            e.preventDefault();
                                            try {
                                                await api.put(`/elections/${id}`, contactInfo);
                                                setElection({ ...election, ...contactInfo });
                                                setShowContactForm(false);
                                                alert('✅ Contact information updated successfully!');
                                            } catch (error) {
                                                alert('❌ Failed to update contact information');
                                            }
                                        }}>
                                            <div className="space-y-4 mb-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Contact Person Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="input-google"
                                                        placeholder="e.g. John Doe"
                                                        value={contactInfo.contactPerson}
                                                        onChange={(e) => setContactInfo({ ...contactInfo, contactPerson: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Contact Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className="input-google"
                                                        placeholder="e.g. contact@example.com"
                                                        value={contactInfo.contactEmail}
                                                        onChange={(e) => setContactInfo({ ...contactInfo, contactEmail: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Contact Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="input-google"
                                                        placeholder="e.g. +254 700 000 000"
                                                        value={contactInfo.contactPhone}
                                                        onChange={(e) => setContactInfo({ ...contactInfo, contactPhone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowContactForm(false)}
                                                    className="flex-1 btn-secondary text-sm py-2"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-1 btn-primary text-sm py-2"
                                                >
                                                    <i className="fas fa-save mr-2"></i>
                                                    Save Changes
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {election.contactPerson || 'Not set'}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {election.contactEmail || 'Not set'}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {election.contactPhone || 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-3">
                                <i className="fas fa-info-circle mr-1"></i>
                                This information will be displayed on the voting page for voters to contact you with inquiries.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Live Results</h3>
                            <div className="space-y-6">
                                {sortedCandidates.map((candidate, index) => {
                                    const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100) : 0;
                                    return (
                                        <div key={candidate._id} className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                                                    <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden">
                                                        {candidate.photoUrl ? (
                                                            <img
                                                                src={candidate.photoUrl.startsWith('http') ? candidate.photoUrl : `http://localhost:5000/uploads/candidates/${candidate.photoUrl}`}
                                                                alt={candidate.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                                                <i className="fas fa-user"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900">{candidate.name}</h4>
                                                        <p className="text-sm text-gray-500">{candidate.position}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-gray-900">{candidate.voteCount}</div>
                                                    <p className="text-sm text-green-600 font-semibold">{percentage.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                                                <div
                                                    className={`h-4 rounded-full transition-all duration-1000 ${
                                                        index === 0 ? 'bg-green-600' : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Analytics Header */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-chart-line text-white text-xl"></i>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                                    <p className="text-sm text-gray-600">Comprehensive insights and voting trends</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pie Chart */}
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Vote Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${entry.name}: ${entry.value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Bar Chart */}
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Vote Comparison</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="votes" fill="#10B981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Vote Timeline */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Vote Timeline (Last 24 Hours)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={voteHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {election.candidates.map((c, index) => (
                                        <Line
                                            key={c._id}
                                            type="monotone"
                                            dataKey={c.name}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={2}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h4 className="text-sm text-gray-500 mb-2">Total Candidates</h4>
                                <p className="text-3xl font-bold text-gray-900">{election.candidates.length}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h4 className="text-sm text-gray-500 mb-2">Total Votes</h4>
                                <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h4 className="text-sm text-gray-500 mb-2">Leading Candidate</h4>
                                <p className="text-lg font-bold text-green-600">{winner?.name || 'N/A'}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h4 className="text-sm text-gray-500 mb-2">Winning Margin</h4>
                                <p className="text-3xl font-bold text-gray-900">
                                    {winner && runnerUp ? winner.voteCount - runnerUp.voteCount : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Voters Tab */}
                {activeTab === 'voters' && (
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Allowed Voters</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage who can vote in this election</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        const csvContent = 'StudentID,Name,Email\nS001,John Doe,john@example.com\nS002,Jane Smith,jane@example.com';
                                        const blob = new Blob([csvContent], { type: 'text/csv' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'voter-template.csv';
                                        a.click();
                                    }}
                                    className="btn-secondary text-sm py-2"
                                >
                                    <i className="fas fa-download mr-2"></i>
                                    Download Template
                                </button>
                                <button 
                                    onClick={() => setShowAddVoter(!showAddVoter)} 
                                    className="btn-secondary text-sm py-2"
                                >
                                    <i className="fas fa-user-plus mr-2"></i>
                                    Add Manually
                                </button>
                                <label className="btn-primary text-sm py-2 cursor-pointer">
                                    <i className="fas fa-upload mr-2"></i>
                                    Import CSV
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            try {
                                                const res = await api.post(`/elections/${id}/voters/import`, formData, {
                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                });
                                                alert(res.data.message);
                                                const votersRes = await api.get(`/elections/${id}/voters`);
                                                setAllowedVoters(votersRes.data);
                                            } catch (error: any) {
                                                alert(error.response?.data?.message || 'Failed to upload voters');
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {showAddVoter && (
                                <form 
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        try {
                                            // Filter out empty rows
                                            const validVoters = newVoters.filter(v => v.studentId.trim() !== '');
                                            
                                            if (validVoters.length === 0) {
                                                alert('⚠️ Please enter at least one Student ID');
                                                return;
                                            }

                                            // Add all voters
                                            const addedVoters = [];
                                            for (const voter of validVoters) {
                                                const res = await api.post(`/elections/${id}/voters`, voter);
                                                addedVoters.push(res.data);
                                            }
                                            
                                            setAllowedVoters([...addedVoters, ...allowedVoters]);
                                            setNewVoters([{ studentId: '', name: '', email: '' }]);
                                            setShowAddVoter(false);
                                            alert(`✅ ${addedVoters.length} voter(s) added successfully!`);
                                        } catch (error: any) {
                                            alert('❌ ' + (error.response?.data?.message || 'Failed to add voters'));
                                        }
                                    }}
                                    className="mb-6 p-4 bg-gray-50 rounded-lg border"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-900">Add Voters Manually</h3>
                                        <button
                                            type="button"
                                            onClick={() => setNewVoters([...newVoters, { studentId: '', name: '', email: '' }])}
                                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                                        >
                                            <i className="fas fa-plus-circle mr-1"></i>
                                            Add Another Row
                                        </button>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        {newVoters.map((voter, index) => (
                                            <div key={index} className="grid md:grid-cols-12 gap-3 items-start">
                                                <div className="md:col-span-3">
                                                    {index === 0 && (
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                                                    )}
                                                    <input
                                                        type="text"
                                                        required
                                                        className="input-google"
                                                        placeholder="e.g. S001"
                                                        value={voter.studentId}
                                                        onChange={(e) => {
                                                            const updated = [...newVoters];
                                                            updated[index].studentId = e.target.value;
                                                            setNewVoters(updated);
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    {index === 0 && (
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
                                                    )}
                                                    <input
                                                        type="text"
                                                        className="input-google"
                                                        placeholder="Full Name"
                                                        value={voter.name}
                                                        onChange={(e) => {
                                                            const updated = [...newVoters];
                                                            updated[index].name = e.target.value;
                                                            setNewVoters(updated);
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    {index === 0 && (
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                                    )}
                                                    <input
                                                        type="email"
                                                        className="input-google"
                                                        placeholder="email@example.com"
                                                        value={voter.email}
                                                        onChange={(e) => {
                                                            const updated = [...newVoters];
                                                            updated[index].email = e.target.value;
                                                            setNewVoters(updated);
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-1 flex items-end">
                                                    {index === 0 && <div className="h-6"></div>}
                                                    {newVoters.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = newVoters.filter((_, i) => i !== index);
                                                                setNewVoters(updated);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 p-2"
                                                            title="Remove row"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <button type="submit" className="btn-primary text-sm py-2">
                                            <i className="fas fa-save mr-2"></i>
                                            Save All Voters
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setShowAddVoter(false);
                                                setNewVoters([{ studentId: '', name: '', email: '' }]);
                                            }} 
                                            className="btn-secondary text-sm py-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {allowedVoters.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <i className="fas fa-users text-4xl mb-4 text-gray-300"></i>
                                    <p className="text-lg font-medium mb-2">No allowed voters yet</p>
                                    <p className="text-sm">Import a CSV file or add voters manually to get started.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b bg-gray-50">
                                                <th className="py-3 px-4 font-medium text-gray-700 text-sm">Student ID</th>
                                                <th className="py-3 px-4 font-medium text-gray-700 text-sm">Name</th>
                                                <th className="py-3 px-4 font-medium text-gray-700 text-sm">Email</th>
                                                <th className="py-3 px-4 font-medium text-gray-700 text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {allowedVoters.map((voter) => (
                                                <tr key={voter._id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-gray-900 font-medium">{voter.studentId}</td>
                                                    <td className="py-3 px-4 text-gray-600">{voter.name || '-'}</td>
                                                    <td className="py-3 px-4 text-gray-600">{voter.email || '-'}</td>
                                                    <td className="py-3 px-4">
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Are you sure you want to remove this voter?')) return;
                                                                try {
                                                                    await api.delete(`/elections/${id}/voters/${voter._id}`);
                                                                    setAllowedVoters(allowedVoters.filter(v => v._id !== voter._id));
                                                                    alert('✅ Voter removed successfully');
                                                                } catch (error: any) {
                                                                    alert('❌ ' + (error.response?.data?.message || 'Failed to remove voter'));
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Remove voter"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-4 text-sm text-gray-500">
                                        Total: {allowedVoters.length} voter{allowedVoters.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Top-Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Add Package to Election</h3>
                            <button
                                onClick={() => setShowTopUpModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Select a package from your available packages to add more credits to this election.
                            </p>

                            {availablePackages.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <i className="fas fa-box-open text-4xl text-gray-300 mb-3"></i>
                                    <p className="text-gray-600 mb-2">No available packages</p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Purchase a package first to add credits to this election.
                                    </p>
                                    <Link href="/pricing" className="btn-primary text-sm py-2 inline-block">
                                        <i className="fas fa-shopping-cart mr-2"></i>
                                        Buy Package
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Package
                                    </label>
                                    {availablePackages.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            onClick={() => setSelectedPackage(pkg.id)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedPackage === pkg.id
                                                    ? 'border-green-600 bg-green-50'
                                                    : 'border-gray-200 hover:border-green-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-gray-900 capitalize">
                                                        {pkg.plan} Plan
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {pkg.voterLimit === -1 ? 'Unlimited' : pkg.voterLimit} Voters
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        KES {pkg.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
                                                    {selectedPackage === pkg.id && (
                                                        <i className="fas fa-check-circle text-green-600 text-xl"></i>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {availablePackages.length > 0 && (
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTopUpModal(false);
                                        setSelectedPackage('');
                                    }}
                                    className="flex-1 btn-secondary text-sm py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddPackage}
                                    disabled={!selectedPackage}
                                    className="flex-1 btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    Add Package
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function ElectionDetailsPage({ params }: { 
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    return <ElectionDetailsContent id={id} />;
}
