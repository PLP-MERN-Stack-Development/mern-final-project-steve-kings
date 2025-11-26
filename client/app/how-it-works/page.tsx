"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import MobileMenu from '@/components/MobileMenu';

export default function HowItWorksPage() {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <i className="fas fa-vote-yea text-white text-base sm:text-xl"></i>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-gray-900">
                                PollSync
                            </span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/#products" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                Features
                            </Link>
                            <Link href="/how-it-works" className="text-green-600 font-semibold">
                                How It Works
                            </Link>
                            <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                Pricing
                            </Link>
                            <Link href="/login" className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                                Login
                            </Link>
                            <Link href="/register" className="btn-primary">
                                <i className="fas fa-arrow-right"></i>
                                Get Started
                            </Link>
                        </div>
                        <MobileMenu />
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="section bg-green-50">
                <div className="container-google">
                    <div className="max-w-4xl mx-auto text-center fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            From Setup to Results in <span className="text-green-600">Four Simple Steps</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Launch professional elections in minutes, not days. Our intuitive platform guides you 
                            through every step—no technical skills needed.
                        </p>
                    </div>
                </div>
            </section>

            {/* Step 1: Create Election */}
            <section className="section">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="slide-in-left">
                            <div className="inline-block mb-4">
                                <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                                    Step 1
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Design Your Perfect Election
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Our smart election builder walks you through every detail. From basic info to 
                                candidate profiles, create a professional election in minutes.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Set Election Details</h4>
                                        <p className="text-gray-600">Enter election name, description, start and end dates</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Add Positions</h4>
                                        <p className="text-gray-600">Create voting positions like President, Secretary, Treasurer, etc.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Add Candidates</h4>
                                        <p className="text-gray-600">Upload candidate information and photos for each position</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl slide-in-right">
                            <Image
                                src="/images/img3.png"
                                alt="Creating election dashboard"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 2: Add Voters */}
            <section className="section-alt">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl slide-in-left order-2 md:order-1">
                            <Image
                                src="/images/img4.png"
                                alt="CSV file upload"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="slide-in-right order-1 md:order-2">
                            <div className="inline-block mb-4">
                                <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                                    Step 2
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Import Your Voters Instantly
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Upload thousands of voters in seconds with our smart CSV importer. Each voter gets 
                                a unique, secure ID automatically—no manual work required.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">CSV Bulk Upload</h4>
                                        <p className="text-gray-600">Upload hundreds or thousands of voters at once using a simple CSV file</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Manual Entry</h4>
                                        <p className="text-gray-600">Add voters one by one through our user-friendly form</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Unique Voter IDs</h4>
                                        <p className="text-gray-600">System automatically generates secure, unique IDs for each voter</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 3: Share & Vote */}
            <section className="section">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="slide-in-left">
                            <div className="inline-block mb-4">
                                <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                                    Step 3
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Launch & Watch Engagement Soar
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                One click to share your election everywhere. Voters access a beautiful, intuitive 
                                ballot from any device. Watch participation rates climb in real-time.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Generate Voting Link</h4>
                                        <p className="text-gray-600">Get a unique, shareable link for your election</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Voters Login Securely</h4>
                                        <p className="text-gray-600">Voters use their unique ID to access the ballot</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Cast Votes</h4>
                                        <p className="text-gray-600">Simple, intuitive voting interface works on any device</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl slide-in-right">
                            <Image
                                src="/images/img5.png"
                                alt="People sharing and voting"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 4: View Results */}
            <section className="section-alt">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl slide-in-left order-2 md:order-1">
                            <Image
                                src="/images/img1.png"
                                alt="Analytics dashboard"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="slide-in-right order-1 md:order-2">
                            <div className="inline-block mb-4">
                                <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                                    Step 4
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Celebrate Instant Results
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                The moment polls close, results appear automatically. No waiting, no manual counting, 
                                no errors. Just accurate, instant results you can trust.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Real-time Monitoring</h4>
                                        <p className="text-gray-600">Track voter turnout and participation as votes come in</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Instant Results</h4>
                                        <p className="text-gray-600">Results are calculated automatically when polls close</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Detailed Reports</h4>
                                        <p className="text-gray-600">Export comprehensive election reports and analytics</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Features */}
            <section className="section bg-green-600 text-white">
                <div className="container-google">
                    <div className="max-w-4xl mx-auto text-center fade-in">
                        <h2 className="text-4xl font-bold mb-6">
                            Security That Never Sleeps
                        </h2>
                        <p className="text-xl text-green-50 mb-12">
                            Every vote protected by multiple layers of enterprise-grade security
                        </p>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                                <i className="fas fa-lock text-4xl mb-4"></i>
                                <h3 className="text-xl font-bold mb-2">Encryption</h3>
                                <p className="text-green-50">All data is encrypted in transit and at rest</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                                <i className="fas fa-user-shield text-4xl mb-4"></i>
                                <h3 className="text-xl font-bold mb-2">Authentication</h3>
                                <p className="text-green-50">Unique voter IDs prevent unauthorized access</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                                <i className="fas fa-ban text-4xl mb-4"></i>
                                <h3 className="text-xl font-bold mb-2">Double-Vote Prevention</h3>
                                <p className="text-green-50">System ensures each voter can only vote once</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section">
                <div className="container-google">
                    <div className="max-w-4xl mx-auto text-center fade-in">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Your Next Election Starts Here
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Join the digital election revolution. Set up your first election in under 10 minutes.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/register" className="btn-primary text-lg px-8 py-4">
                                <i className="fas fa-arrow-right mr-2"></i>
                                Create Your Election
                            </Link>
                            <Link href="/pricing" className="bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all inline-flex items-center gap-2">
                                <i className="fas fa-info-circle mr-2"></i>
                                View Pricing
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-12 bg-gray-50">
                <div className="container-google">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <i className="fas fa-vote-yea text-white"></i>
                            </div>
                            <span className="font-bold text-gray-900">PollSync</span>
                        </div>
                        <div className="flex justify-center space-x-6 text-sm text-gray-600 mb-4">
                            <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
                            <Link href="/how-it-works" className="hover:text-green-600 transition-colors">How It Works</Link>
                            <Link href="/pricing" className="hover:text-green-600 transition-colors">Pricing</Link>
                            <Link href="/login" className="hover:text-green-600 transition-colors">Login</Link>
                        </div>
                        <p className="text-sm text-gray-600">
                            <i className="fas fa-heart text-red-500"></i> Built with love in Kenya &copy; 2025 PollSync
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
