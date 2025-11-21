"use client";

import { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
    onSuccess: (credential: string) => void;
    onError?: () => void;
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}

declare global {
    interface Window {
        google?: any;
    }
}

export default function GoogleSignInButton({ 
    onSuccess, 
    onError,
    text = 'signup_with'
}: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load Google Sign-In script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.google && buttonRef.current) {
                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    callback: (response: any) => {
                        if (response.credential) {
                            onSuccess(response.credential);
                        }
                    },
                });

                window.google.accounts.id.renderButton(
                    buttonRef.current,
                    {
                        theme: 'outline',
                        size: 'large',
                        text: text,
                        width: buttonRef.current.offsetWidth,
                        logo_alignment: 'left',
                    }
                );
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [onSuccess, text]);

    return <div ref={buttonRef} className="w-full"></div>;
}
