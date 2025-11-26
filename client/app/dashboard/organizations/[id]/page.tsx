"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

interface Organization {
    _id: string;
    name: string;
    description: string;
    logo: string;
    website: string;
    email: string;
    phone: string;
    address: string;
    owner: any;
    members: any[];
    isActive: boolean;
    createdAt: string;
}

interface Election {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
    candidates: any[];
    voters: any[];
}

function OrganizationDetailsContent({ id }: { id: string }) {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [elections, setElections] = useState<Election[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditForm, setShowEditForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && id) {
            fetchOrganization();
            fetchElections();
        }
    }, [user, id]);

    const fetchOrganization = async () => {
        try {
            const res = await api.get(`/organizations/${id}`);
            setOrganization(res.data);
            setFormData({
                name: res.data.name,
                description: res.data.description || '',
                website: res.data.website || '',
                email: res.data.email || '',
                phone: res.data.phone || '',
                address: res.data.address || ''
            });
        } catch (error) {
            console.error('Failed to fetch organization', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchElections = async () => {
        try {
            const res = await api.get('/elections');
            // Filter elections by this organization
            const orgElections = res.data.filter((e: Election) => 
                (e as any).organizationId === id || (e as any).organization === organization?.name
            );
            setElections(orgElections);
        } catch (error) {
            console.error('Failed to fetch elections', error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/organizations/${id}`, formData);
            alert('✅ Organization updated successfully!');
            setShowEditForm(false);
            fetchOrganization();
        } catch (error: any) {
            alert('❌ ' + (error.response?.data?.message || 'Failed to update organization'));
        }
    };

    if (authLoading || !user || isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="spinner-google"></div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Organization not found</h2>
                    <Link href="/dashboard/organizations" className="text-green-600 hover:underline mt-4 inline-block">
                        Back to Organizations
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
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
                            <Link href="/dashboard/organizations" className="text-gray-600 hover:text-green-600">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Organizations
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Organization Header */}
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-building text-green-600 text-2xl"></i>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                                <span className="badge badge-success mt-2">Active</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEditForm(true)}
                            className="btn-secondary"
                        >
                            <i className="fas fa-edit mr-2"></i>
                            Edit Details
                        </button>
                    </div>

                    {organization.description && (
                        <p className="text-gray-600 mb-6">{organization.description}</p>
                    )}

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {organization.website && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <i className="fas fa-globe text-blue-600"></i>
                                <div>
                                    <p className="text-xs text-gray-500">Website</p>
                                    <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        Visit Site
                                    </a>
                                </div>
                            </div>
                        )}
                        {organization.email && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <i className="fas fa-envelope text-green-600"></i>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm text-gray-900">{organization.email}</p>
                                </div>
                            </div>
                        )}
                        {organization.phone && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <i className="fas fa-phone text-purple-600"></i>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm text-gray-900">{organization.phone}</p>
                                </div>
                            </div>
                        )}
                        {organization.address && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <i className="fas fa-map-marker-alt text-red-600"></i>
                                <div>
                                    <p className="text-xs text-gray-500">Address</p>
                                    <p className="text-sm text-gray-900">{organization.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form Modal */}
                {showEditForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Organization</h2>
                            <form onSubmit={handleUpdate}>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="input-google"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            className="input-google min-h-[100px]"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                className="input-google"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                className="input-google"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                className="input-google"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                className="input-google"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditForm(false)}
                                        className="flex-1 btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn-primary">
                                        <i className="fas fa-save mr-2"></i>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Elections Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Elections</h2>
                        <Link href="/dashboard/create-election" className="btn-primary">
                            <i className="fas fa-plus mr-2"></i>
                            Create Election
                        </Link>
                    </div>

                    {elections.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-poll text-gray-400 text-3xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No elections yet</h3>
                            <p className="text-gray-500 mb-8">
                                Create your first election for this organization.
                            </p>
                            <Link href="/dashboard/create-election" className="btn-primary">
                                <i className="fas fa-plus mr-2"></i>
                                Create Election
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {elections.map((election) => (
                                <div key={election._id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all">
                                    <div className="h-2 bg-green-500 w-full"></div>
                                    <div className="p-6">
                                        <span className={`badge ${election.status === 'active' ? 'badge-success' : election.status === 'completed' ? 'badge-info' : 'badge-warning'} mb-3`}>
                                            {election.status}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{election.title}</h3>
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <div>
                                                <i className="fas fa-users mr-1"></i>
                                                {election.candidates.length} Candidates
                                            </div>
                                            <div>
                                                <i className="fas fa-vote-yea mr-1"></i>
                                                {election.voters.length} Voters
                                            </div>
                                        </div>
                                        <Link
                                            href={`/dashboard/elections/${election._id}`}
                                            className="block text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            View Election
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}


export default function OrganizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <OrganizationDetailsContent id={id} />;
}
