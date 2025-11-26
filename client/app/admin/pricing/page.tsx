'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PricingPlan {
    _id: string;
    planId: string;
    name: string;
    price: number;
    voterLimit: number;
    currency: string;
    enabled: boolean;
    description?: string;
    features?: string[];
}

export default function AdminPricingPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/admin/pricing`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plan: PricingPlan) => {
        setEditingPlan({ ...plan });
    };

    const handleSave = async () => {
        if (!editingPlan) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/admin/pricing/${editingPlan.planId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editingPlan.name,
                    price: editingPlan.price,
                    voterLimit: editingPlan.voterLimit,
                    enabled: editingPlan.enabled,
                    description: editingPlan.description,
                    features: editingPlan.features
                })
            });

            if (response.ok) {
                await fetchPlans();
                setEditingPlan(null);
                alert('Pricing updated successfully!');
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to update pricing');
            }
        } catch (error) {
            console.error('Error updating pricing:', error);
            alert('Failed to update pricing');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEnabled = async (plan: PricingPlan) => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/admin/pricing/${plan.planId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    enabled: !plan.enabled
                })
            });

            if (response.ok) {
                await fetchPlans();
            }
        } catch (error) {
            console.error('Error toggling plan:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading pricing plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin-dashboard')}
                        className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
                    >
                        ← Back to Admin Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
                    <p className="text-gray-600 mt-2">Manage and monetize your platform pricing</p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                        <div>
                            <p className="font-medium text-blue-900">Dynamic Pricing System</p>
                            <p className="text-sm text-blue-800 mt-1">
                                Changes take effect immediately across the platform. Users will see updated prices on the pricing page and during payment.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pricing Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan._id}
                            className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                                !plan.enabled ? 'opacity-60' : ''
                            }`}
                        >
                            {/* Plan Header */}
                            <div className={`p-6 ${
                                plan.planId === 'unlimited' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                                plan.planId === 'standard' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
                                plan.planId === 'starter' ? 'bg-gradient-to-r from-green-600 to-teal-600' :
                                'bg-gradient-to-r from-gray-600 to-gray-700'
                            }`}>
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-white">
                                        {plan.currency} {plan.price}
                                    </span>
                                </div>
                                <p className="text-white/80 mt-2">
                                    {plan.voterLimit === -1 ? 'Unlimited' : plan.voterLimit} voters
                                </p>
                            </div>

                            {/* Plan Body */}
                            <div className="p-6">
                                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                                
                                {/* Status Badge */}
                                <div className="mb-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        plan.enabled 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {plan.enabled ? '✓ Active' : '✗ Disabled'}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleEdit(plan)}
                                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <i className="fas fa-edit mr-2"></i>
                                        Edit Plan
                                    </button>
                                    <button
                                        onClick={() => handleToggleEnabled(plan)}
                                        className={`w-full py-2 px-4 rounded-lg transition-colors ${
                                            plan.enabled
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                    >
                                        <i className={`fas ${plan.enabled ? 'fa-ban' : 'fa-check'} mr-2`}></i>
                                        {plan.enabled ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edit Modal */}
                {editingPlan && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Edit {editingPlan.name}
                                    </h2>
                                    <button
                                        onClick={() => setEditingPlan(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <i className="fas fa-times text-xl"></i>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Plan Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Plan Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editingPlan.name}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price (KES)
                                        </label>
                                        <input
                                            type="number"
                                            value={editingPlan.price}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                            min="0"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Voter Limit */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Voter Limit (-1 for unlimited)
                                        </label>
                                        <input
                                            type="number"
                                            value={editingPlan.voterLimit}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, voterLimit: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={editingPlan.description || ''}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Enabled Toggle */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="enabled"
                                            checked={editingPlan.enabled}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, enabled: e.target.checked })}
                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                                            Plan Enabled (visible to users)
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setEditingPlan(null)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
