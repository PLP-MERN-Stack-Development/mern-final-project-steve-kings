"use client";

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" data-theme="pollsync" suppressHydrationWarning>
            <head>
                <title>PollSync - Digital Elections Made Simple</title>
                <meta name="description" content="Kenya's premier election management platform. Create, manage, and execute secure digital elections with M-Pesa integration." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            </head>
            <body className="custom-scrollbar" suppressHydrationWarning>
                <Provider store={store}>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </Provider>
            </body>
        </html>
    );
}
