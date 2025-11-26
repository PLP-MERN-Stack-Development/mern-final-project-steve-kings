"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import api from '@/lib/api';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password,
            });

            const userData = response.data;

            // Extract token and user data
            const { token, ...user } = userData;

            // Call the context login function with token and user
            login(token, user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center shadow-lg">
                            <i className="fas fa-vote-yea text-white text-2xl"></i>
                        </div>
                        <span className="text-3xl font-bold text-gray-900">PollSync</span>
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Welcome back</h1>
                    <p className="text-sm md:text-base text-gray-600">Sign in to continue to PollSync</p>
                </div>

                {/* Form */}
                <div className="card-google p-6 md:p-8 shadow-xl">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-google"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-900">
                                    Password
                                </label>
                                <Link href="/auth/forgot-password" className="text-sm text-green-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-google"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <div className="spinner-google w-5 h-5 mr-2"></div>
                                    Signing in...
                                </span>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt mr-2"></i>
                                    Sign in
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <GoogleSignInButton
                        text="signin_with"
                        onSuccess={async (credential) => {
                            try {
                                setLoading(true);
                                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                                const response = await fetch(`${API_URL}/auth/google`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ credential }),
                                });

                                const data = await response.json();

                                if (!response.ok) {
                                    throw new Error(data.message || 'Google sign-in failed');
                                }

                                login(data.token, data.user);
                            } catch (err: any) {
                                setError(err.message || 'Google sign-in failed');
                                setLoading(false);
                            }
                        }}
                        onError={() => {
                            setError('Google sign-in failed. Please try again.');
                        }}
                    />

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-green-600 hover:text-green-700 font-medium inline-flex items-center transition-colors">
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
