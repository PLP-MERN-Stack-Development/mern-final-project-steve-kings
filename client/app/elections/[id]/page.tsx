"use client";

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Candidate {
    _id: string;
    name: string;
    manifesto: string;
    voteCount: number;
}

interface Election {
    _id: string;
    title: string;
    description: string;
    clubName: string;
    startDate: string;
    endDate: string;
    candidates: Candidate[];
}

export default function ElectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, isLoading } = useAuth();
    const [election, setElection] = useState<Election | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [isVoting, setIsVoting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchElection = async () => {
            try {
                const res = await api.get(`/elections/${id}`);
                setElection(res.data);
            } catch (err) {
                console.error('Failed to fetch election', err);
            }
        };

        if (user) {
            fetchElection();
        }
    }, [user, id]);

    const handleVote = async () => {
        if (!selectedCandidate) return;
        setIsVoting(true);
        setMessage('');

        try {
            await api.post(`/elections/${id}/vote`, { candidateId: selectedCandidate });
            setMessage('Vote cast successfully!');
            setMessageType('success');
            // Refresh election data
            const res = await api.get(`/elections/${id}`);
            setElection(res.data);
            setSelectedCandidate(null);
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to cast vote');
            setMessageType('error');
        } finally {
            setIsVoting(false);
        }
    };

    if (isLoading || !election) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <div className="pulse-glow rounded-full w-16 h-16 bg-primary"></div>
            </div>
        );
    }

    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    const isUpcoming = now < startDate;
    const isActive = now >= startDate && now <= endDate;
    const isEnded = now > endDate;

    const totalVotes = election.candidates.reduce((sum, c) => sum + c.voteCount, 0);

    return (
        <div className="min-h-screen bg-background">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Dashboard</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg"></div>
                            <h1 className="text-xl font-bold gradient-text">VoteHub</h1>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Election Header */}
                <div className="glass-card rounded-2xl p-8 mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{election.title}</h1>
                            <p className="text-primary text-lg mb-4">{election.clubName}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium border ${isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                isUpcoming ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                            {isActive ? '🟢 Active Now' : isUpcoming ? '🔵 Upcoming' : '⚫ Ended'}
                        </div>
                    </div>
                    <p className="text-foreground/70 mb-6">{election.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-foreground/60">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Starts: {new Date(election.startDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Ends: {new Date(election.endDate).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg border ${messageType === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-destructive/10 border-destructive/20 text-destructive'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Upcoming Message */}
                {isUpcoming && (
                    <div className="glass-card rounded-2xl p-8 text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Election Not Started Yet</h3>
                        <p className="text-foreground/60">This election will start on {new Date(election.startDate).toLocaleString()}</p>
                    </div>
                )}

                {/* Candidates */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6">Candidates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {election.candidates.map((candidate) => {
                            const votePercentage = totalVotes > 0 ? (candidate.voteCount / totalVotes * 100).toFixed(1) : 0;

                            return (
                                <div
                                    key={candidate._id}
                                    onClick={() => isActive && !isVoting && setSelectedCandidate(candidate._id)}
                                    className={`glass-card rounded-2xl p-6 transition-all ${isActive && !isVoting ? 'cursor-pointer hover-glow' : 'cursor-default'
                                        } ${selectedCandidate === candidate._id
                                            ? 'ring-2 ring-primary bg-primary/5'
                                            : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-1">{candidate.name}</h3>
                                            {candidate.manifesto && (
                                                <p className="text-foreground/70 text-sm">{candidate.manifesto}</p>
                                            )}
                                        </div>
                                        {selectedCandidate === candidate._id && isActive && (
                                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {isEnded && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-foreground/60">Votes</span>
                                                <span className="text-sm font-bold text-primary">{candidate.voteCount} ({votePercentage}%)</span>
                                            </div>
                                            <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                                    style={{ width: `${votePercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Vote Button */}
                {isActive && (
                    <div className="glass-card rounded-2xl p-6">
                        <button
                            onClick={handleVote}
                            disabled={!selectedCandidate || isVoting}
                            className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary rounded-lg font-semibold text-lg hover-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isVoting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Casting Vote...
                                </span>
                            ) : selectedCandidate ? 'Cast Your Vote' : 'Select a Candidate'}
                        </button>
                    </div>
                )}

                {/* Results Summary */}
                {isEnded && (
                    <div className="glass-card rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Election Ended</h3>
                        <p className="text-foreground/60 mb-4">Total Votes Cast: <span className="text-primary font-bold">{totalVotes}</span></p>
                        <p className="text-sm text-foreground/50">Results are displayed above</p>
                    </div>
                )}
            </main>
        </div>
    );
}

