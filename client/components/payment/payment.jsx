"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import io from 'socket.io-client';

export default function PaymentButton({ amount, phoneNumber, onSuccess }) {
    const [status, setStatus] = useState('idle');
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

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
                if (data.status === 'success') {
                    setStatus('success');
                    if (onSuccess) {
                        console.log('Calling onSuccess callback');
                        onSuccess();
                    }
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
                alert('Payment initiated! Check your phone to complete the transaction.');

                // Set a timeout to check payment status after 60 seconds
                setTimeout(async () => {
                    if (status === 'pending') {
                        console.log('Payment pending for 60s, checking status...');
                        // Still pending after 1 minute - check if credit was added
                        try {
                            const userRes = await api.get('/auth/profile');
                            const hasNewCredit = userRes.data.electionCredits?.some(c => !c.used);
                            if (hasNewCredit) {
                                console.log('✅ Credit found! Payment was successful');
                                setStatus('success');
                                if (onSuccess) onSuccess();
                            }
                        } catch (err) {
                            console.error('Failed to check payment status:', err);
                        }
                    }
                }, 60000);
            } else {
                setStatus('error');
                alert('Failed to initiate payment: ' + response.data.message);
            }
        } catch (error) {
            console.error('Payment Error:', error);
            setStatus('error');
            alert('Payment failed: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
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
    );
}
