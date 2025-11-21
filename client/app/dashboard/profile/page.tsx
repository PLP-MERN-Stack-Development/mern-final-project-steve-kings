"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setUser(res.data);
            setFormData({
                username: res.data.username,
                email: res.data.email,
                phoneNumber: res.data.phoneNumber || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password change if provided
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                alert('New passwords do not match');
                return;
            }
            if (formData.newPassword.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
        }

        setIsSaving(true);

        try {
            const updateData: any = {
                username: formData.username,
                email: formData.email,
                phoneNumber: formData.phoneNumber
            };

            // Track if password is being changed
            const isChangingPassword = !!formData.newPassword;

            // Only include password if changing it
            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            const res = await api.put('/auth/profile', updateData);

            // If password was changed, logout and redirect to login
            if (isChangingPassword) {
                alert('Password changed successfully! Please login with your new password.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            }

            // Update local storage if email changed (only for non-password updates)
            const userData = localStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                parsed.username = res.data.username;
                parsed.email = res.data.email;
                localStorage.setItem('user', JSON.stringify(parsed));
            }

            alert('Profile updated successfully!');

            // Clear password fields
            setFormData({
                ...formData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            fetchProfile();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
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
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 mb-4 inline-block">
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-600 mt-2">Manage your account information and password</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="input-google"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            className="input-google"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Phone Number (Optional)
                                        </label>
                                        <input
                                            type="tel"
                                            className="input-google"
                                            placeholder="+254 XXX XXX XXX"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        />
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <i className="fas fa-shield-alt text-gray-400"></i>
                                            <span>Role: <strong className="text-gray-900">{user?.role || 'User'}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Change Password */}
                            <div className="pt-6 border-t border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
                                <p className="text-sm text-gray-600 mb-4">Leave blank if you don't want to change your password</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="input-google"
                                            placeholder="Enter new password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="input-google"
                                            placeholder="Confirm new password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                <Link href="/dashboard" className="btn-secondary">
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="spinner-google w-5 h-5 mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
