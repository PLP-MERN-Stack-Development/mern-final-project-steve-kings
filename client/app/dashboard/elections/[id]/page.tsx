"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { io } from 'socket.io-client';

interface Candidate {
    _id: string;
    name: string;
    position: string;
    photoUrl: string;
    voteCount: number;
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
}

export default function ElectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [election, setElection] = useState<Election | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allowedVoters, setAllowedVoters] = useState<any[]>([]);
    const [showAddVoter, setShowAddVoter] = useState(false);
    const [newVoter, setNewVoter] = useState({ studentId: '', name: '', email: '' });

    useEffect(() => {
        const fetchElection = async () => {
            try {
                const res = await api.get(`/elections/${id}`);
                setElection(res.data);
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
        const socket = io('http://localhost:5000');

        socket.emit('join_election', id);

        socket.on('vote_update', (data) => {
            setElection(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    candidates: data.candidates,
                    voters: new Array(data.totalVotes) // Update length for display
                };
            });
        });

        socket.on('election_updated', (updatedElection) => {
            setElection(updatedElection);
        });

        return () => {
            socket.disconnect();
        };
    }, [id]);

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
    const shareUrl = `${window.location.origin}/vote/${election._id}`;

    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    let status = 'upcoming';
    if (now >= startDate && now <= endDate) {
        status = 'active';
    } else if (now > endDate) {
        status = 'completed';
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
            try {
                await api.delete(`/elections/${id}`);
                alert('Election deleted successfully');
                router.push('/dashboard');
            } catch (error) {
                console.error('Failed to delete election', error);
                alert('Failed to delete election');
            }
        }
    };

    const downloadTemplate = () => {
        const csvContent = 'StudentID,Name,Email\nS001,John Doe,john@example.com\nS002,Jane Smith,jane@example.com';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voter-template.csv';
        a.click();
    };

    const handleAddVoter = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post(`/elections/${id}/voters`, newVoter);
            setAllowedVoters([res.data, ...allowedVoters]);
            setNewVoter({ studentId: '', name: '', email: '' });
            setShowAddVoter(false);
            alert('Voter added successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add voter');
        }
    };

    const handleVoterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/elections/${id}/voters/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            // Refresh list
            const votersRes = await api.get(`/elections/${id}/voters`);
            setAllowedVoters(votersRes.data);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to upload voters');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans py-10">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 mb-4 inline-block">
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
                        <p className="text-gray-600 mt-1">{election.organization}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/dashboard/elections/${id}/edit`} className="btn-secondary">
                            <i className="fas fa-edit mr-2"></i>
                            Edit
                        </Link>
                        <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200">
                            <i className="fas fa-trash-alt mr-2"></i>
                            Delete
                        </button>
                        <Link href={`/dashboard/elections/${id}/candidates`} className="btn-secondary">
                            <i className="fas fa-user-plus mr-2"></i>
                            Candidates
                        </Link>
                        <button onClick={copyToClipboard} className="btn-primary">
                            <i className="fas fa-share-alt mr-2"></i>
                            Share
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Status</h3>
                        <span className={`badge ${status === 'active' ? 'badge-success' :
                            status === 'completed' ? 'badge-info' : 'badge-warning'
                            } text-lg px-4 py-1`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Votes</h3>
                        <div className="text-3xl font-bold text-gray-900">{totalVotes}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Voters</h3>
                        <div className="text-3xl font-bold text-gray-900">{election.voters.length}</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Live Results</h2>
                    </div>
                    <div className="p-6">
                        {election.candidates.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No candidates added yet.</p>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(election.candidates.reduce((acc, candidate) => {
                                    if (!acc[candidate.position]) {
                                        acc[candidate.position] = [];
                                    }
                                    acc[candidate.position].push(candidate);
                                    return acc;
                                }, {} as Record<string, Candidate[]>)).map(([position, candidates]) => {
                                    const totalVotesForPosition = candidates.reduce((acc, curr) => acc + curr.voteCount, 0);

                                    return (
                                        <div key={position}>
                                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 border-gray-100">
                                                {position}
                                            </h3>
                                            <div className="space-y-6">
                                                {candidates.sort((a, b) => b.voteCount - a.voteCount).map((candidate) => {
                                                    const percentage = totalVotesForPosition > 0 ? Math.round((candidate.voteCount / totalVotesForPosition) * 100) : 0;
                                                    return (
                                                        <div key={candidate._id}>
                                                            <div className="flex justify-between items-end mb-2">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                                        {candidate.photoUrl ? (
                                                                            <img
                                                                                src={candidate.photoUrl.startsWith('http') ? candidate.photoUrl : `http://localhost:5000/uploads/candidates/${candidate.photoUrl}`}
                                                                                alt={candidate.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                <i className="fas fa-user"></i>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-bold text-gray-900">{candidate.name}</h3>
                                                                        <p className="text-sm text-gray-500">{candidate.position}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-2xl font-bold text-gray-900">{candidate.voteCount}</span>
                                                                    <span className="text-gray-500 ml-1">votes</span>
                                                                    <p className="text-sm text-green-600 font-medium">{percentage}%</p>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                                <div
                                                                    className="bg-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Voter Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Allowed Voters</h2>
                        <div className="flex gap-2">
                            <button onClick={downloadTemplate} className="btn-secondary text-sm py-2">
                                <i className="fas fa-download mr-2"></i>
                                Template
                            </button>
                            <button onClick={() => setShowAddVoter(!showAddVoter)} className="btn-secondary text-sm py-2">
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
                                    onChange={handleVoterUpload}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="p-6">
                        {showAddVoter && (
                            <form onSubmit={handleAddVoter} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-4">Add Voter Manually</h3>
                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-google"
                                            placeholder="e.g. S001"
                                            value={newVoter.studentId}
                                            onChange={(e) => setNewVoter({ ...newVoter, studentId: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
                                        <input
                                            type="text"
                                            className="input-google"
                                            placeholder="Full Name"
                                            value={newVoter.name}
                                            onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="input-google"
                                            placeholder="email@example.com"
                                            value={newVoter.email}
                                            onChange={(e) => setNewVoter({ ...newVoter, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="btn-primary text-sm py-2">
                                        <i className="fas fa-plus mr-2"></i>
                                        Add Voter
                                    </button>
                                    <button type="button" onClick={() => setShowAddVoter(false)} className="btn-secondary text-sm py-2">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                        {allowedVoters.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="mb-2">No allowed voters imported yet.</p>
                                <p className="text-sm">Import a CSV file to restrict voting to specific students.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-3 font-medium text-gray-500">Student ID</th>
                                            <th className="pb-3 font-medium text-gray-500">Name</th>
                                            <th className="pb-3 font-medium text-gray-500">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {allowedVoters.slice(0, 10).map((voter) => (
                                            <tr key={voter._id} className="border-b border-gray-50 last:border-0">
                                                <td className="py-3 text-gray-900 font-medium">{voter.studentId}</td>
                                                <td className="py-3 text-gray-600">{voter.name || '-'}</td>
                                                <td className="py-3 text-gray-600">{voter.email || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {allowedVoters.length > 10 && (
                                    <p className="text-center text-sm text-gray-500 mt-4">
                                        Showing 10 of {allowedVoters.length} voters
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
