"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import PricingModal from '@/components/PricingModal';

interface Organization {
    _id: string;
    name: string;
}

export default function CreateElectionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    const [hasUnusedPackage, setHasUnusedPackage] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        organization: '',
        organizationId: '',
        startDate: '',
        endDate: '',
        description: '',
        thumbnailUrl: ''
    });

    useEffect(() => {
        fetchOrganizations();
        checkAvailablePackages();
    }, []);

    const checkAvailablePackages = async () => {
        try {
            const res = await api.get('/auth/credits/realtime');
            // Check for packages not assigned to any election
            const unused = res.data.electionPackages?.packages?.filter((pkg: any) => !pkg.electionId) || [];
            setAvailablePackages(unused);
            setHasUnusedPackage(unused.length > 0);
        } catch (error) {
            console.error('Failed to check packages', error);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const res = await api.get('/organizations');
            setOrganizations(res.data);
        } catch (error) {
            console.error('Failed to fetch organizations', error);
        }
    };

    const handleOrganizationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOrg = organizations.find(org => org._id === e.target.value);
        setFormData({
            ...formData,
            organizationId: e.target.value,
            organization: selectedOrg?.name || ''
        });
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if user has an unused package
        if (!hasUnusedPackage) {
            alert('⚠️ You need to purchase a package before creating an election!');
            setShowPricingModal(true);
            return;
        }

        setIsLoading(true);

        try {
            let thumbnailUrl = '';

            // Upload thumbnail if provided
            if (thumbnailFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('image', thumbnailFile);
                const uploadRes = await api.post('/upload/election-thumbnail', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                thumbnailUrl = uploadRes.data.filename;
            }

            // Create election with thumbnail
            const res = await api.post('/elections', { ...formData, thumbnailUrl });
            // Redirect to add candidates page
            router.push(`/dashboard/elections/${res.data._id}/candidates`);
        } catch (error: any) {
            console.error('Failed to create election', error);

            // Handle 403 - No credits available - Show pricing modal
            if (error.response?.status === 403) {
                setShowPricingModal(true);
            } else {
                alert(error.response?.data?.message || 'Failed to create election');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setShowPricingModal(false);
        checkAvailablePackages(); // Refresh package status
        alert('✅ Payment successful! You can now create your election.');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans py-10">
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8">
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 mb-4 inline-block">
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Election</h1>
                    <p className="text-gray-600 mt-2">Set up the basic details for your election.</p>
                </div>

                {/* Package Warning */}
                {!hasUnusedPackage && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-red-900 mb-2">Package Required</h3>
                                <p className="text-red-700 mb-4">
                                    You need to purchase a package before creating a new election. Each election requires its own package.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowPricingModal(true)}
                                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    <i className="fas fa-shopping-cart mr-2"></i>
                                    Purchase Package
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {hasUnusedPackage && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center space-x-3">
                            <i className="fas fa-check-circle text-green-600 text-xl"></i>
                            <div>
                                <p className="text-green-800 font-medium">
                                    ✅ You have {availablePackages.length} unused package{availablePackages.length > 1 ? 's' : ''} available
                                </p>
                                <p className="text-sm text-green-700">You can create a new election</p>
                            </div>
                        </div>
                    </div>
                )}

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
                                    Organization <span className="text-red-500">*</span>
                                </label>
                                {organizations.length > 0 ? (
                                    <select
                                        required
                                        className="input-google"
                                        value={formData.organizationId}
                                        onChange={handleOrganizationChange}
                                    >
                                        <option value="">Select an organization</option>
                                        {organizations.map((org) => (
                                            <option key={org._id} value={org._id}>
                                                {org.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800 mb-2">
                                            <i className="fas fa-exclamation-triangle mr-2"></i>
                                            No organizations found. Please create one first.
                                        </p>
                                        <Link
                                            href="/dashboard/organizations"
                                            className="text-sm text-green-600 hover:underline font-medium"
                                        >
                                            <i className="fas fa-plus mr-1"></i>
                                            Create Organization
                                        </Link>
                                    </div>
                                )}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Election Thumbnail (Optional)
                                </label>
                                <p className="text-sm text-gray-500 mb-3">This image will be shown when sharing the election link</p>
                                <div className="flex items-center gap-4">
                                    {thumbnailPreview && (
                                        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                                            <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <label className="btn-secondary cursor-pointer">
                                        <i className="fas fa-image mr-2"></i>
                                        {thumbnailPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleThumbnailChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary"
                                >
                                    {isLoading ? 'Creating...' : 'Next: Add Candidates'}
                                    <i className="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Pricing Modal */}
            <PricingModal
                isOpen={showPricingModal}
                onClose={() => setShowPricingModal(false)}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
