"use client";

import { useState, useEffect } from 'react';
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

export default function OrganizationsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
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
        if (user) {
            fetchOrganizations();
        }
    }, [user]);

    const fetchOrganizations = async () => {
        try {
            const res = await api.get('/organizations');
            setOrganizations(res.data);
        } catch (error) {
            console.error('Failed to fetch organizations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/organizations', formData);
            alert('✅ Organization created successfully!');
            setShowCreateForm(false);
            setFormData({ name: '', description: '', website: '', email: '', phone: '', address: '' });
            fetchOrganizations();
        } catch (error: any) {
            alert('❌ ' + (error.response?.data?.message || 'Failed to create organization'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this organization?')) return;
        
        try {
            await api.delete(`/organizations/${id}`);
            alert('✅ Organization deleted successfully');
            fetchOrganizations();
        } catch (error: any) {
            alert('❌ ' + (error.response?.data?.message || 'Failed to delete organization'));
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
                            <Link href="/dashboard" className="text-gray-600 hover:text-green-600">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                        <p className="text-gray-600 mt-1">Manage your organizations and their details</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn-primary"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Create Organization
                    </button>
                </div>

                {/* Create Form Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Organization</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="input-google"
                                            placeholder="e.g. Computer Science Club"
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
                                            placeholder="Brief description of your organization"
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
                                                placeholder="https://example.com"
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
                                                placeholder="contact@example.com"
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
                                                placeholder="+254 700 000 000"
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
                                                placeholder="City, Country"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="flex-1 btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn-primary">
                                        <i className="fas fa-save mr-2"></i>
                                        Create Organization
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Organizations List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="spinner-google"></div>
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-building text-gray-400 text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No organizations yet</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Create your first organization to start managing elections.
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="btn-primary"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Create Organization
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {organizations.map((org) => (
                            <div key={org._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                                <div className="h-2 bg-green-500 w-full"></div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-building text-green-600 text-xl"></i>
                                        </div>
                                        <span className="badge badge-success">Active</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{org.name}</h3>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {org.description || 'No description'}
                                    </p>
                                    <div className="space-y-2 mb-4 text-sm text-gray-500">
                                        {org.email && (
                                            <div className="flex items-center">
                                                <i className="fas fa-envelope w-4 mr-2"></i>
                                                {org.email}
                                            </div>
                                        )}
                                        {org.phone && (
                                            <div className="flex items-center">
                                                <i className="fas fa-phone w-4 mr-2"></i>
                                                {org.phone}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <Link
                                            href={`/dashboard/organizations/${org._id}`}
                                            className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            <i className="fas fa-eye mr-2"></i>
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(org._id)}
                                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
