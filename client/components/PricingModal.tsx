"use client";

import { useState } from 'react';
import PaymentButton from '@/components/payment/payment';
import { useAuth } from '@/context/AuthContext';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PricingModal({ isOpen, onClose, onSuccess }: PricingModalProps) {
    const { user } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; voters: string } | null>(null);

    const plans = [
        {
            name: 'Free',
            voters: '10 Voters',
            price: 5,
            features: ['Up to 10 Voters', 'Basic Analytics', '3 Days Duration'],
            recommended: false
        },
        {
            name: 'Starter',
            voters: '50 Voters',
            price: 500,
            features: ['Up to 50 Voters', 'Basic Analytics', '7 Days Duration'],
            recommended: false
        },
        {
            name: 'Standard',
            voters: '200 Voters',
            price: 1500,
            features: ['Up to 200 Voters', 'Advanced Analytics', '30 Days Duration'],
            recommended: true
        },
        {
            name: 'Unlimited',
            voters: 'Unlimited Voters',
            price: 3000,
            features: ['Unlimited Voters', 'Real-time Results', 'Custom Branding'],
            recommended: false
        }
    ];

    const handlePaymentSuccess = () => {
        alert('Payment Successful! You can now create your election.');
        onSuccess();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Purchase Election Credit</h2>
                        <p className="text-gray-600 mt-1">Select a plan to create your election</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        ×
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${selectedPlan?.name === plan.name
                                        ? 'border-green-500 bg-green-50 shadow-lg'
                                        : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                                    }`}
                                onClick={() => setSelectedPlan(plan)}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        BEST
                                    </div>
                                )}
                                <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                                <div className="text-2xl font-extrabold text-gray-900 mb-2">
                                    KES {plan.price.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{plan.voters}</p>
                                <ul className="space-y-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="text-xs text-gray-600 flex items-start">
                                            <i className="fas fa-check text-green-500 mr-1 mt-0.5"></i>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Payment Section */}
                    {selectedPlan && (
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">Complete Payment</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                You are paying <span className="font-bold text-gray-900">KES {selectedPlan.price.toLocaleString()}</span> for the <span className="font-bold text-green-600">{selectedPlan.name}</span> plan.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        M-PESA Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-sm">🇰🇪 +254</span>
                                        </div>
                                        <input
                                            type="tel"
                                            className="block w-full pl-20 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                            placeholder="712 345 678"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <PaymentButton
                                    amount={selectedPlan.price.toString()}
                                    phoneNumber={phoneNumber}
                                    onSuccess={handlePaymentSuccess}
                                />
                            </div>

                            <p className="text-xs text-gray-500 mt-4 flex items-center justify-center">
                                <i className="fas fa-lock mr-2"></i>
                                Secure payment via Kopokopo & M-PESA
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
