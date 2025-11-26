"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface Candidate {
    _id?: string;
    name: string;
    position: string;
    manifesto: string;
    photoUrl: string;
}

export default function AddCandidatesPage() {
    const params = useParams();
    const router = useRouter();
    const electionId = params.id;

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [newCandidate, setNewCandidate] = useState<Candidate>({
        name: '',
        position: '',
        manifesto: '',
        photoUrl: ''
    });

    useEffect(() => {
        // Fetch existing candidates if any
        const fetchElection = async () => {
            try {
                const res = await api.get(`/elections/${electionId}`);
                if (res.data.candidates) {
                    setCandidates(res.data.candidates);
                }
            } catch (error) {
                console.error('Failed to fetch election', error);
            }
        };
        fetchElection();
    }, [electionId]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload/candidate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setNewCandidate({ ...newCandidate, photoUrl: res.data.filename });
        } catch (error) {
            console.error('Failed to upload image', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await api.post(`/elections/${electionId}/candidates`, newCandidate);
            setCandidates(res.data.candidates);
            setNewCandidate({
                name: '',
                position: '',
                manifesto: '',
                photoUrl: ''
            });
        } catch (error) {
            console.error('Failed to add candidate', error);
            alert('Failed to add candidate');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans py-10">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 mb-4 inline-block">
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Add Candidates</h1>
                        <p className="text-gray-600 mt-2">Add candidates for each position in your election.</p>
                    </div>
                    <Link href={`/dashboard`} className="btn-secondary">
                        Done & Finish
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Add Candidate Form */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">New Candidate</h3>
                            <form onSubmit={handleAddCandidate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Position</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-google"
                                        placeholder="e.g. President"
                                        value={newCandidate.position}
                                        onChange={(e) => setNewCandidate({ ...newCandidate, position: e.target.value })}
                                        list="positions-list"
                                    />
                                    <datalist id="positions-list">
                                        {Array.from(new Set(candidates.map(c => c.position))).map(pos => (
                                            <option key={pos} value={pos} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-google"
                                        placeholder="Candidate Name"
                                        value={newCandidate.name}
                                        onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Candidate Photo</label>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="file-input file-input-bordered file-input-success w-full"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                        {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
                                        {newCandidate.photoUrl && (
                                            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                                <img
                                                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/candidates/${newCandidate.photoUrl}`}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Manifesto</label>
                                    <textarea
                                        required
                                        className="input-google min-h-[100px]"
                                        placeholder="Candidate's goals..."
                                        value={newCandidate.manifesto}
                                        onChange={(e) => setNewCandidate({ ...newCandidate, manifesto: e.target.value })}
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-primary"
                                >
                                    {isLoading ? 'Adding...' : 'Add Candidate'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Candidates List */}
                    <div className="md:col-span-2">
                        <div className="space-y-6">
                            {candidates.length === 0 ? (
                                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                                    <div className="text-gray-400 mb-4">
                                        <i className="fas fa-users text-4xl"></i>
                                    </div>
                                    <p className="text-gray-500">No candidates added yet.</p>
                                </div>
                            ) : (
                                candidates.map((candidate, index) => (
                                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-6">
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                            {candidate.photoUrl ? (
                                                <img
                                                    src={candidate.photoUrl.startsWith('http') ? candidate.photoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/candidates/${candidate.photoUrl}`}
                                                    alt={candidate.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <i className="fas fa-user text-2xl"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="badge badge-info mb-2">{candidate.position}</div>
                                            <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
                                            <p className="text-gray-600 mt-2 text-sm">{candidate.manifesto}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
