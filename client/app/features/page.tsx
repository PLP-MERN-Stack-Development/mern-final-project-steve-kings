"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import MobileMenu from '@/components/MobileMenu';

export default function FeaturesPage() {
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

        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach((el) => {
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
                            <Link href="/features" className="text-green-600 font-semibold">
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
                            Built for <span className="text-green-600">Election Excellence</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            A comprehensive suite of tools designed to make your elections seamless, secure, and successful. 
                            Professional results without the complexity.
                        </p>
                    </div>
                </div>
            </section>

            {/* Voter Management */}
            <section className="section">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="slide-in-left">
                            <div className="inline-block mb-4">
                                <span className="badge badge-success">
                                    <i className="fas fa-users mr-2"></i>
                                    Voter Management
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Effortless Voter Management
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Scale from 50 to 50,000 voters without breaking a sweat. Our intelligent system 
                                handles the complexity so you can focus on running a great election.
                            </p>
                            <div className="space-y-4">
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-file-upload text-green-600 mr-3"></i>
                                        Bulk File Upload
                                    </h4>
                                    <p className="text-gray-600">Upload hundreds or thousands of voters at once using CSV or Excel files. Save hours of manual data entry.</p>
                                </div>
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-user-plus text-green-600 mr-3"></i>
                                        Individual Registration
                                    </h4>
                                    <p className="text-gray-600">Add voters one by one through our intuitive form. Perfect for small elections or last-minute additions.</p>
                                </div>
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-id-card text-green-600 mr-3"></i>
                                        Unique Voter IDs
                                    </h4>
                                    <p className="text-gray-600">Each voter receives a unique ID for secure authentication. No passwords to remember or manage.</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl slide-in-right">
                            <Image
                                src="/images/img2.png"
                                alt="Team collaboration"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Secure Voting */}
            <section className="section-alt">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl slide-in-left order-2 md:order-1">
                            <Image
                                src="/images/img3.png"
                                alt="Security lock"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="slide-in-right order-1 md:order-2">
                            <div className="inline-block mb-4">
                                <span className="badge badge-success">
                                    <i className="fas fa-shield-halved mr-2"></i>
                                    Security
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Military-Grade Security
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Sleep soundly knowing your elections are protected by enterprise-level security. 
                                We use the same encryption standards trusted by global financial institutions.
                            </p>
                            <div className="space-y-4">
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-lock text-green-600 mr-3"></i>
                                        End-to-End Encryption
                                    </h4>
                                    <p className="text-gray-600">All votes are encrypted from the moment they're cast until they're counted. Nobody can see individual votes.</p>
                                </div>
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-ban text-green-600 mr-3"></i>
                                        Double-Vote Prevention
                                    </h4>
                                    <p className="text-gray-600">Our system ensures each voter can only vote once. Duplicate votes are automatically blocked.</p>
                                </div>
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-user-shield text-green-600 mr-3"></i>
                                        Secure Authentication
                                    </h4>
                                    <p className="text-gray-600">Unique voter IDs prevent unauthorized access. Only registered voters can participate.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Real-time Results */}
            <section className="section">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="slide-in-left">
                            <div className="inline-block mb-4">
                                <span className="badge badge-success">
                                    <i className="fas fa-chart-line mr-2"></i>
                                    Analytics
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Intelligence at Your Fingertips
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Transform raw votes into actionable insights. Our real-time analytics dashboard 
                                gives you complete visibility into every aspect of your election.
                            </p>
                            <div className="space-y-4">
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-clock text-green-600 mr-3"></i>
                                        Live Vote Tracking
                                    </h4>
                                    <p className="text-gray-600">Watch voter turnout in real-time. See how many people have voted and who hasn't yet.</p>
                                </div>
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-bolt text-green-600 mr-3"></i>
                                        Instant Results
                                    </h4>
                                    <p className="text-gray-600">Results are calculated automatically the moment polls close. No waiting, no manual counting.</p>
                                </div>
                                <div className="card-google p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <i className="fas fa-download text-green-600 mr-3"></i>
                                        Export Reports
                                    </h4>
                                    <p className="text-gray-600">Download comprehensive election reports with detailed statistics and voter participation data.</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl slide-in-right">
                            <Image
                                src="/images/img4.png"
                                alt="Analytics dashboard"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Additional Features Grid */}
            <section className="section-alt">
                <div className="container-google">
                    <div className="text-center mb-16 fade-in">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Even More to Love
                        </h2>
                        <p className="text-xl text-gray-600">
                            Discover the features that make PollSync the complete election solution
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="card-google p-8 text-center scale-in">
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-image text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Rich Candidate Profiles</h3>
                            <p className="text-gray-600">Showcase candidates with photos, manifestos, and bios. Help voters make informed decisions with comprehensive profiles.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.1s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-share-nodes text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Viral-Ready Sharing</h3>
                            <p className="text-gray-600">One-click sharing to email, SMS, WhatsApp, and social media. Maximize voter turnout with effortless distribution.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.2s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-mobile-alt text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Device Agnostic</h3>
                            <p className="text-gray-600">Flawless experience on every screen size. From smartphones to desktops, your voters get a perfect interface.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.3s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-calendar-alt text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Scheduling</h3>
                            <p className="text-gray-600">Set it and forget it. Polls automatically open and close at your scheduled times. No manual intervention needed.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.4s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-list-check text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Complex Ballots Made Simple</h3>
                            <p className="text-gray-600">Run multi-position elections effortlessly. From President to Treasurer, handle unlimited positions in a single, elegant ballot.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.5s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-headset text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Human Support</h3>
                            <p className="text-gray-600">Real people, real help. Our dedicated support team is here to ensure your election runs smoothly from start to finish.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section bg-green-600 text-white">
                <div className="container-google">
                    <div className="max-w-4xl mx-auto text-center fade-in">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Experience the Difference
                        </h2>
                        <p className="text-xl text-green-50 mb-8">
                            See why organizations choose PollSync for their most important elections
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/register" className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                <i className="fas fa-arrow-right mr-2"></i>
                                Get Started
                            </Link>
                            <Link href="/how-it-works" className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg">
                                <i className="fas fa-play-circle mr-2"></i>
                                See How It Works
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
                            <Link href="/features" className="hover:text-green-600 transition-colors">Features</Link>
                            <Link href="/how-it-works" className="hover:text-green-600 transition-colors">How It Works</Link>
                            <Link href="/pricing" className="hover:text-green-600 transition-colors">Pricing</Link>
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
