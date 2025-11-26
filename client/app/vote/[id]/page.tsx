"use client";

import { use, useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { io } from 'socket.io-client';
import Head from 'next/head';

interface Candidate {
    _id: string;
    name: string;
    position: string;
    photoUrl: string;
    manifesto: string;
    voteCount: number;
}

interface Election {
    _id: string;
    title: string;
    description: string;
    organization: string;
    startDate: string;
    endDate: string;
    candidates: Candidate[];
    status: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
}

export default function PublicVotingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [election, setElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<'verify' | 'vote' | 'success'>('verify');
    const [voterId, setVoterId] = useState('');
    const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
    const [votedPositions, setVotedPositions] = useState<string[]>([]);

    useEffect(() => {
        const fetchElection = async () => {
            try {
                const res = await api.get(`/elections/${id}`);
                setElection(res.data);
            } catch (err) {
                console.error('Failed to fetch election', err);
                setMessage('Election not found');
                setMessageType('error');
            } finally {
                setLoading(false);
            }
        };

        fetchElection();
    }, [id]);

    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.emit('join_election', id);

        socket.on('election_updated', (updatedElection) => {
            setElection(updatedElection);
        });

        return () => {
            socket.disconnect();
        };
    }, [id]);

    const handleVerify = async () => {
        if (!voterId.trim()) {
            setMessage('Please enter your ID number');
            setMessageType('error');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post(`/elections/${id}/check-eligibility`, { voterId });
            setVotedPositions(res.data.votedPositions);
            setMessage('');
            setStep('vote');
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Verification failed');
            setMessageType('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async () => {
        if (Object.keys(selectedCandidates).length === 0) {
            setMessage('Please select at least one candidate');
            setMessageType('error');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            // Submit votes sequentially or parallel
            const promises = Object.entries(selectedCandidates).map(([position, candidateId]) =>
                api.post(`/elections/${id}/vote`, {
                    voterId,
                    candidateId
                })
            );

            await Promise.all(promises);

            setStep('success');
            setMessage('Your votes have been cast successfully!');
            setMessageType('success');

        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to cast vote');
            setMessageType('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCandidate = (position: string, candidateId: string) => {
        if (votedPositions.includes(position)) return;
        setSelectedCandidates(prev => ({
            ...prev,
            [position]: candidateId
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <div className="spinner-google"></div>
            </div>
        );
    }

    if (!election) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="card-google max-w-md text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Election Not Found</h2>
                    <p className="text-gray-600">The election you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    const isUpcoming = now < startDate;
    const isActive = now >= startDate && now <= endDate;
    const isEnded = now > endDate;

    return (
        <>
            <Head>
                <title>{election.title} - PollSync</title>
                <meta property="og:title" content={election.title} />
                <meta property="og:description" content={election.description || `Vote in ${election.organization}'s election`} />
                <meta property="og:image" content={
                    (election as any).thumbnailUrl
                        ? `${window.location.origin}/uploads/elections/${(election as any).thumbnailUrl}`
                        : `${window.location.origin}/default-election.png`
                } />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={election.title} />
                <meta name="twitter:description" content={election.description || `Vote in ${election.organization}'s election`} />
                <meta name="twitter:image" content={
                    (election as any).thumbnailUrl
                        ? `${window.location.origin}/uploads/elections/${(election as any).thumbnailUrl}`
                        : `${window.location.origin}/default-election.png`
                } />
            </Head>
            <div className="min-h-screen bg-gray-50 font-sans">
                {/* Header */}
                <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center items-center h-16">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-vote-yea text-white text-sm"></i>
                                </div>
                                <span className="text-xl font-bold text-gray-900">PollSync</span>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    {/* Election Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 ${isActive ? 'bg-green-100 text-green-800' :
                            isUpcoming ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-600' :
                                isUpcoming ? 'bg-blue-600' :
                                    'bg-gray-600'
                                }`}></span>
                            {isActive ? 'Voting Open' : isUpcoming ? 'Coming Soon' : 'Voting Closed'}
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-2">{election.title}</h1>
                        <p className="text-green-600 font-medium text-base sm:text-lg mb-3 sm:mb-4">{election.organization}</p>
                        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">{election.description}</p>
                    </div>

                    {/* Contact Information Card */}
                    {(election.contactPerson || election.contactEmail || election.contactPhone) && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6 mb-6 sm:mb-8">
                            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <i className="fas fa-question-circle text-white"></i>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">Have Questions?</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                If you have any inquiries about this election, feel free to contact us:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                {election.contactPerson && (
                                    <div className="bg-white rounded-lg p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3 min-w-0">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <i className="fas fa-user text-blue-600"></i>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-gray-500">Contact Person</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">{election.contactPerson}</p>
                                        </div>
                                    </div>
                                )}
                                {election.contactEmail && (
                                    <a href={`mailto:${election.contactEmail}`} className="bg-white rounded-lg p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3 hover:shadow-md transition-shadow min-w-0">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <i className="fas fa-envelope text-green-600"></i>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-blue-600 hover:underline truncate">{election.contactEmail}</p>
                                        </div>
                                    </a>
                                )}
                                {election.contactPhone && (
                                    <a href={`tel:${election.contactPhone}`} className="bg-white rounded-lg p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3 hover:shadow-md transition-shadow min-w-0">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <i className="fas fa-phone text-purple-600"></i>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm font-medium text-blue-600 hover:underline truncate">{election.contactPhone}</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg border flex items-start ${messageType === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                            messageType === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                'bg-blue-50 border-blue-200 text-blue-800'
                            }`}>
                            <i className={`fas ${messageType === 'success' ? 'fa-check-circle' :
                                messageType === 'error' ? 'fa-exclamation-circle' :
                                    'fa-info-circle'
                                } mt-0.5 mr-3`}></i>
                            <span>{message}</span>
                        </div>
                    )}

                    {/* Upcoming State */}
                    {isUpcoming && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <i className="fas fa-clock text-3xl"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Voting Hasn't Started Yet</h2>
                            <p className="text-gray-600 mb-2">Voting will open on:</p>
                            <p className="text-xl font-semibold text-blue-600">{new Date(election.startDate).toLocaleString()}</p>
                        </div>
                    )}

                    {/* Ended State */}
                    {isEnded && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 text-gray-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <i className="fas fa-lock text-3xl"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Voting Has Ended</h2>
                            <p className="text-gray-600 mb-2">This election closed on:</p>
                            <p className="text-xl font-semibold text-gray-900">{new Date(election.endDate).toLocaleString()}</p>
                        </div>
                    )}

                    {/* Active Voting */}
                    {isActive && (
                        <>
                            {/* Step 1: Verify ID */}
                            {step === 'verify' && (
                                <div className="max-w-md mx-auto">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                <i className="fas fa-user-shield text-2xl"></i>
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
                                            <p className="text-gray-600">Enter your Student ID to proceed</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-900">
                                                    Student ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={voterId}
                                                    onChange={(e) => setVoterId(e.target.value)}
                                                    placeholder="Enter your ID number"
                                                    className="input-google text-lg"
                                                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                                                />
                                            </div>

                                            <button
                                                onClick={handleVerify}
                                                className="w-full btn-primary text-lg py-3"
                                            >
                                                Continue to Vote
                                                <i className="fas fa-arrow-right ml-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Vote */}
                            {step === 'vote' && (!election.candidates || election.candidates.length === 0) && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                        <i className="fas fa-exclamation-triangle text-3xl"></i>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No Candidates Available</h2>
                                    <p className="text-gray-600">There are no candidates registered for this election yet.</p>
                                </div>
                            )}

                            {step === 'vote' && election && election.candidates && election.candidates.length > 0 && (
                                <div>
                                    <div className="mb-6 text-center">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Candidates</h2>
                                        <p className="text-gray-600">You can select one candidate for each position.</p>
                                    </div>

                                    <div className="space-y-12 mb-8">
                                        {Object.entries(election.candidates.reduce((acc, candidate) => {
                                            if (!acc[candidate.position]) {
                                                acc[candidate.position] = [];
                                            }
                                            acc[candidate.position].push(candidate);
                                            return acc;
                                        }, {} as Record<string, Candidate[]>)).map(([position, candidates]) => (
                                            <div key={position}>
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2 border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                    <span>{position}</span>
                                                    {votedPositions.includes(position) && (
                                                        <span className="text-xs sm:text-sm text-green-600 font-medium bg-green-50 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                                                            <i className="fas fa-check-circle mr-1"></i> Voted
                                                        </span>
                                                    )}
                                                </h3>
                                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 ${votedPositions.includes(position) ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    {candidates.map((candidate) => (
                                                        <div
                                                            key={candidate._id}
                                                            onClick={() => toggleCandidate(position, candidate._id)}
                                                            className={`bg-white rounded-xl border p-4 sm:p-6 cursor-pointer transition-all ${selectedCandidates[position] === candidate._id
                                                                ? 'border-green-600 ring-2 ring-green-600 ring-opacity-50 shadow-md transform scale-[1.02]'
                                                                : 'border-gray-200 hover:border-green-400 hover:shadow-md'
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                                    {candidate.photoUrl ? (
                                                                        <img
                                                                            src={candidate.photoUrl.startsWith('http') ? candidate.photoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/candidates/${candidate.photoUrl}`}
                                                                            alt={candidate.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                            <i className="fas fa-user text-xl sm:text-2xl"></i>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {selectedCandidates[position] === candidate._id && (
                                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                                                        <i className="fas fa-check text-sm"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 break-words">{candidate.name}</h3>
                                                            <div className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded mb-2 sm:mb-3">
                                                                {candidate.position}
                                                            </div>
                                                            {candidate.manifesto && (
                                                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-3 break-words">{candidate.manifesto}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-2xl mx-auto">
                                        <button
                                            onClick={() => setStep('verify')}
                                            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm sm:text-base"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleVote}
                                            disabled={Object.keys(selectedCandidates).length === 0 || isSubmitting}
                                            className="flex-1 btn-primary text-base sm:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center">
                                                    <div className="spinner-google w-4 h-4 sm:w-5 sm:h-5 mr-2 border-white border-t-transparent"></div>
                                                    Submitting...
                                                </span>
                                            ) : 'Cast Votes'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Success */}
                            {step === 'success' && (
                                <div className="max-w-md mx-auto">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                                            <i className="fas fa-check-circle text-4xl"></i>
                                        </div>
                                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Vote Cast Successfully!</h2>
                                        <p className="text-gray-600 text-lg mb-8">
                                            Thank you for participating in this election. Your vote has been recorded securely.
                                        </p>
                                        <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                                            <i className="fas fa-lock mr-2"></i>
                                            Your vote is final and cannot be changed
                                        </div>
                                        <div className="mt-8">
                                            <Link href="/" className="text-green-600 hover:underline font-medium">
                                                Return to Home
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-200 py-8 mt-12 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                        <p>Powered by <span className="text-green-600 font-bold">PollSync</span> - Secure Digital Elections</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
