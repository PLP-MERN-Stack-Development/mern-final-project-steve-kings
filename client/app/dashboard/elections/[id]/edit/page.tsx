"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function EditElectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        organization: '',
        startDate: '',
        endDate: '',
        description: ''
    });

    useEffect(() => {
        const fetchElection = async () => {
            try {
                const res = await api.get(`/elections/${id}`);
                const election = res.data;

                // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
                const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    return date.toISOString().slice(0, 16);
                };

                setFormData({
                    title: election.title,
                    organization: election.organization,
                    startDate: formatDate(election.startDate),
                    endDate: formatDate(election.endDate),
                    description: election.description || ''
                });
            } catch (error) {
                console.error('Failed to fetch election', error);
                alert('Failed to load election details');
                router.push('/dashboard');
            } finally {
                setIsFetching(false);
            }
        };

        fetchElection();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.put(`/elections/${id}`, formData);
            alert('Election updated successfully!');
            router.push(`/dashboard/elections/${id}`);
        } catch (error) {
            console.error('Failed to update election', error);
            alert('Failed to update election');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="spinner-google"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans py-10">
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8">
                    <Link href={`/dashboard/elections/${id}`} className="text-sm text-gray-500 hover:text-green-600 mb-4 inline-block">
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Election Details
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Election</h1>
                    <p className="text-gray-600 mt-2">Update the details for your election.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Election Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input-google"
                                    placeholder="e.g. CS Club Leadership Elections 2025"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Organization Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input-google"
                                    placeholder="e.g. Computer Science Club"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Start Date & Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="input-google"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        End Date & Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="input-google"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="input-google min-h-[120px]"
                                    placeholder="Describe the purpose of this election..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary"
                                >
                                    {isLoading ? 'Updating...' : 'Save Changes'}
                                    <i className="fas fa-save ml-2"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
