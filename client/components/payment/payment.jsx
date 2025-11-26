"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import io from 'socket.io-client';

export default function PaymentButton({ amount, phoneNumber, onSuccess }) {
    const [status, setStatus] = useState('idle');
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [transactionId, setTransactionId] = useState(null);
    const [showManualComplete, setShowManualComplete] = useState(false);
    const [manualCompleting, setManualCompleting] = useState(false);

    useEffect(() => {
        console.log('=== Payment Button Mount ===');
        console.log('User:', user?._id);
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

        // Connect to socket for real-time updates
        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        console.log('Connecting to socket:', socketUrl);

        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);

        if (user) {
            console.log('Joining room:', user._id);
            newSocket.emit('join_room', user._id);

            newSocket.on('payment_success', (data) => {
                console.log('✅ Payment success event received:', data);
                setStatus('success');
                alert(`✅ Payment successful! You received ${data.voterLimit === -1 ? 'unlimited' : data.voterLimit} voter credits.`);
                if (onSuccess) {
                    console.log('Calling onSuccess callback');
                    onSuccess();
                }
            });

            newSocket.on('payment_failed', (data) => {
                console.log('❌ Payment failed event received:', data);
                setStatus('failed');
                if (data.status === 'cancelled') {
                    alert('❌ Payment cancelled. Please try again.');
                } else {
                    alert('❌ Payment failed. Please try again.');
                }
            });
        }

        return () => {
            console.log('Cleaning up socket connection');
            newSocket.close();
        };
    }, [user, onSuccess]);

    const handlePayment = async () => {
        if (!phoneNumber) {
            alert('Please enter a phone number');
            return;
        }

        console.log('=== Initiating Payment ===');
        console.log('Phone:', phoneNumber);
        console.log('Amount:', amount);

        setStatus('loading');
        try {
            const response = await api.post('/payment/stk-push', {
                phoneNumber,
                amount
            });

            console.log('STK Push Response:', JSON.stringify(response.data, null, 2));
            console.log('Success field:', response.data.success);
            console.log('Message:', response.data.message);

            if (response.data.success) {
                setStatus('pending');
                const txId = response.data.data.transactionId;
                setTransactionId(txId);
                alert('📱 STK Push sent! Check your phone to complete payment.');

                // Show manual complete button after 15 seconds
                setTimeout(() => {
                    setShowManualComplete(true);
                }, 15000);

                // Start polling for payment status as fallback
                let pollAttempts = 0;
                const maxAttempts = 40; // 40 attempts * 3 seconds = 2 minutes

                const pollInterval = setInterval(async () => {
                    pollAttempts++;

                    // Stop if already successful or failed
                    if (status === 'success' || status === 'failed') {
                        clearInterval(pollInterval);
                        return;
                    }

                    console.log(`Polling attempt ${pollAttempts}/${maxAttempts}...`);

                    try {
                        const statusRes = await api.get(`/payment/check-status/${txId}`);
                        console.log('Status check:', statusRes.data);

                        if (statusRes.data.status === 'success' && statusRes.data.processed) {
                            console.log('✅ Payment successful via polling!');
                            clearInterval(pollInterval);
                            setStatus('success');
                            alert(`✅ Payment successful! You received ${statusRes.data.transaction.voterLimit === -1 ? 'unlimited' : statusRes.data.transaction.voterLimit} voter credits.`);
                            if (onSuccess) onSuccess();
                        } else if (statusRes.data.status === 'failed' || statusRes.data.status === 'cancelled') {
                            console.log('❌ Payment failed/cancelled via polling');
                            clearInterval(pollInterval);
                            setStatus('failed');
                            if (statusRes.data.status === 'cancelled') {
                                alert('❌ Payment cancelled. Please try again.');
                            } else {
                                alert('❌ Payment failed. Please try again.');
                            }
                        } else if (pollAttempts >= maxAttempts) {
                            console.log('⏱️ Polling timeout');
                            clearInterval(pollInterval);
                            setStatus('error');
                            alert('⏱️ Payment confirmation timeout. If you paid, check your transactions or contact support.');
                        }
                    } catch (err) {
                        console.error('Polling error:', err);
                        if (pollAttempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            setStatus('error');
                            alert('⏱️ Unable to confirm payment. Please check your transactions.');
                        }
                    }
                }, 3000); // Poll every 3 seconds
            } else {
                setStatus('error');
                alert('❌ Failed to initiate payment: ' + response.data.message);
            }
        } catch (error) {
            console.error('Payment Error:', error);
            setStatus('error');
            alert('Payment failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleManualComplete = async () => {
        if (!transactionId) {
            alert('No transaction ID found');
            return;
        }

        const confirmed = window.confirm(
            '⚠️ Only click this if you have completed the M-Pesa payment on your phone.\n\n' +
            'Have you entered your PIN and received an M-Pesa confirmation SMS?'
        );

        if (!confirmed) return;

        setManualCompleting(true);
        try {
            console.log('Manually completing transaction:', transactionId);
            const response = await api.post(`/payment/manual-credit`, {
                transactionId
            });

            if (response.data.success) {
                setStatus('success');
                setShowManualComplete(false);
                alert(`✅ Payment confirmed! You received ${response.data.credit.voterLimit === -1 ? 'unlimited' : response.data.credit.voterLimit} voter credits.`);
                if (onSuccess) onSuccess();
            } else {
                alert('❌ ' + response.data.message);
            }
        } catch (error) {
            console.error('Manual completion error:', error);
            alert('❌ Failed to complete payment: ' + (error.response?.data?.message || error.message));
        } finally {
            setManualCompleting(false);
        }
    };

    return (
        <div className="space-y-3">
            <button
            onClick={handlePayment}
            disabled={status === 'loading' || status === 'pending' || status === 'success'}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${status === 'loading' || status === 'pending' ? 'bg-gray-400 cursor-not-allowed' :
                status === 'success' ? 'bg-green-600 cursor-default' :
                    status === 'failed' || status === 'error' ? 'bg-red-600 hover:bg-red-700' :
                        'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
        >
            {status === 'loading' ? 'Processing...' :
                status === 'pending' ? 'Waiting for payment...' :
                    status === 'success' ? '✅ Payment Successful!' :
                        status === 'failed' ? 'Payment Failed. Try Again' :
                            status === 'error' ? 'Error. Try Again' :
                                `Pay KES ${amount}`}
            </button>

            {showManualComplete && status === 'pending' && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <i className="fas fa-exclamation-triangle text-yellow-600 mt-1"></i>
                        <div className="flex-1">
                            <h4 className="font-semibold text-yellow-900 mb-1">Payment Taking Too Long?</h4>
                            <p className="text-sm text-yellow-800 mb-3">
                                If you've completed the M-Pesa payment on your phone but credits haven't been added, click below to manually confirm.
                            </p>
                            <button
                                onClick={handleManualComplete}
                                disabled={manualCompleting}
                                className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {manualCompleting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Confirming Payment...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-check-circle mr-2"></i>
                                        I've Completed the Payment
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-yellow-700 mt-2">
                                ⚠️ Only click if you've entered your M-Pesa PIN and received a confirmation SMS
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
