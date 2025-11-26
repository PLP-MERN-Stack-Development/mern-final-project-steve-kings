'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BulkEmailPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        targetUsers: 'all'
    });
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        fetchEmailStats();
    }, []);

    const fetchEmailStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/email-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.subject || !formData.message) {
            alert('Please fill in all fields');
            return;
        }

        if (!confirm(`Send email to ${getTargetCount()} users?`)) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/send-bulk-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                setFormData({ subject: '', message: '', targetUsers: 'all' });
            } else {
                alert(data.message || 'Failed to send emails');
            }
        } catch (error) {
            console.error('Error sending emails:', error);
            alert('Failed to send emails');
        } finally {
            setLoading(false);
        }
    };

    const getTargetCount = () => {
        if (!stats) return 0;
        const target = stats.targetGroups.find((g: any) => g.value === formData.targetUsers);
        return target ? target.count : 0;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin-dashboard')}
                        className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
                    >
                        ← Back to Admin Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Bulk Email Marketing</h1>
                    <p className="text-gray-600 mt-2">Send announcements and updates to all users</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">With Email</p>
                            <p className="text-3xl font-bold text-indigo-600">{stats.usersWithEmail}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">Organizers</p>
                            <p className="text-3xl font-bold text-green-600">{stats.organizers}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <p className="text-gray-600 text-sm">Admins</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.admins}</p>
                        </div>
                    </div>
                )}

                {/* Email Form */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Target Users */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Send To
                            </label>
                            <select
                                value={formData.targetUsers}
                                onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                {stats?.targetGroups.map((group: any) => (
                                    <option key={group.value} value={group.value}>
                                        {group.label} ({group.count} users)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Subject *
                            </label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="e.g., New Features Available on PollSync!"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Message *
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Write your message here..."
                                rows={10}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                This will be sent as a beautifully formatted HTML email with PollSync branding.
                            </p>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                            <div className="bg-white p-4 rounded border">
                                <p className="font-bold text-lg mb-2">{formData.subject || 'Subject will appear here'}</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{formData.message || 'Message will appear here'}</p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {loading ? 'Sending...' : `Send Email to ${getTargetCount()} Users`}
                        </button>
                    </form>
                </div>

                {/* Result */}
                {result && (
                    <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <h3 className={`font-bold text-lg mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                            {result.success ? '✅ Email Sent Successfully!' : '❌ Email Failed'}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Total Recipients:</strong> {result.results?.total}</p>
                            <p><strong>Successfully Sent:</strong> {result.results?.sent}</p>
                            <p><strong>Failed:</strong> {result.results?.failed}</p>
                            <p><strong>Success Rate:</strong> {result.results?.successRate}</p>
                        </div>
                        {result.errors && result.errors.length > 0 && (
                            <div className="mt-4">
                                <p className="font-medium text-red-800 mb-2">Errors:</p>
                                <ul className="list-disc list-inside text-sm text-red-700">
                                    {result.errors.map((err: any, idx: number) => (
                                        <li key={idx}>{err.email}: {err.error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Tips */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-blue-900 mb-3">📧 Email Tips</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• Keep subject lines clear and concise (under 50 characters)</li>
                        <li>• Personalize your message to engage users</li>
                        <li>• Include a clear call-to-action</li>
                        <li>• Test with a small group first (send to admins only)</li>
                        <li>• Avoid sending too frequently to prevent spam complaints</li>
                        <li>• Emails are sent in batches of 50 to ensure deliverability</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
