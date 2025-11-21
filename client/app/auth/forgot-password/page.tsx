"use client";

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await api.post('/auth/verify-email', { email });
            if (res.data.found) {
                setStep('reset');
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Email not found');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/reset-password', { email, newPassword });
            alert('Password reset successful! You can now login.');
            router.push('/auth/login');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
                        <i className="fas fa-lock text-white text-2xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {step === 'email'
                            ? 'Enter your email to verify your account'
                            : 'Enter your new password'}
                    </p>
                </div>

                <div className="card-google">
                    {step === 'email' ? (
                        <form onSubmit={handleVerifyEmail} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="input-google"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Email'}
                            </button>

                            <div className="text-center">
                                <Link href="/auth/login" className="text-sm text-green-600 hover:underline">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    <i className="fas fa-check-circle mr-2"></i>
                                    Email verified: <strong>{email}</strong>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="input-google"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="input-google"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full"
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="btn-secondary w-full"
                            >
                                Change Email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
