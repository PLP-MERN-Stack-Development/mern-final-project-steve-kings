"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/register', {
                username,
                email,
                password,
                phoneNumber
            });

            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async (credential: string) => {
        try {
            setIsLoading(true);
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
                throw new Error(data.message || 'Google sign-up failed');
            }

            // Redirect to login or dashboard
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message || 'Google sign-up failed');
        } finally {
            setIsLoading(false);
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
                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Create your account</h1>
                    <p className="text-sm md:text-base text-gray-600">Join thousands of organizations using PollSync</p>
                </div>

                {/* Form */}
                <div className="card-google p-6 md:p-8 shadow-xl">
                    {/* Google Sign-Up Button */}
                    <div className="mb-6">
                        <GoogleSignInButton
                            text="signup_with"
                            onSuccess={handleGoogleSignUp}
                            onError={() => {
                                setError('Google sign-up failed. Please try again.');
                            }}
                        />
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-google"
                                placeholder="johndoe"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-google"
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="input-google"
                                placeholder="0712345678"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-google"
                                placeholder="Create a strong password"
                                required
                                minLength={6}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <div className="spinner-google w-5 h-5 mr-2"></div>
                                    Creating account...
                                </span>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus mr-2"></i>
                                    Create account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-500">
                            By creating an account, you agree to our{' '}
                            <Link href="#" className="text-green-600 hover:underline">Terms</Link>
                            {' '}and{' '}
                            <Link href="#" className="text-green-600 hover:underline">Privacy Policy</Link>
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
