"use client";

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
            <div className="container-google">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                            <i className="fas fa-vote-yea text-white text-xl"></i>
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            PollSync
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/features" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                            Features
                        </Link>
                        <Link href="/how-it-works" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                            How It Works
                        </Link>
                        <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                            Pricing
                        </Link>
                        <Link href="/login" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                            Login
                        </Link>
                        <Link href="/register" className="btn-primary">
                            Get Started Free
                        </Link>
                    </div>
                    <div className="md:hidden">
                        <Link href="/register" className="btn-primary text-sm px-4 py-2">
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
