"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';

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
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="container-google">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <i className="fas fa-vote-yea text-white text-xl"></i>
                            </div>
                            <span className="text-xl font-bold text-gray-900">
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
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="section bg-green-50">
                <div className="container-google">
                    <div className="max-w-4xl mx-auto text-center fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Powerful Features for <span className="text-green-600">Modern Elections</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Everything you need to run secure, transparent, and efficient online elections. 
                            No technical expertise required.
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
                                Manage Voters with Ease
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Add and manage your voter list efficiently. Whether you have 50 or 5,000 voters, 
                                PollSync makes it simple.
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
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
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
                                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80"
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
                                Enterprise-Grade Security
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Your elections are protected by the same security standards used by banks and financial institutions.
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
                                Real-time Results & Analytics
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Monitor your election in real-time and get instant results when polls close. No manual counting needed.
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
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
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
                            More Powerful Features
                        </h2>
                        <p className="text-xl text-gray-600">
                            Everything you need for successful elections
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="card-google p-8 text-center scale-in">
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-image text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Candidate Photos</h3>
                            <p className="text-gray-600">Upload photos for each candidate to help voters make informed decisions. Supports multiple image formats.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.1s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-share-nodes text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Sharing</h3>
                            <p className="text-gray-600">Generate shareable voting links. Share via email, SMS, WhatsApp, or social media with one click.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.2s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-mobile-alt text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Friendly</h3>
                            <p className="text-gray-600">Works perfectly on phones, tablets, and computers. Voters can participate from any device.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.3s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-calendar-alt text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Schedule Elections</h3>
                            <p className="text-gray-600">Set start and end dates for your elections. Polls automatically open and close at scheduled times.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.4s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-list-check text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Multiple Positions</h3>
                            <p className="text-gray-600">Create elections with multiple positions. Voters can vote for President, Secretary, Treasurer, and more in one ballot.</p>
                        </div>
                        <div className="card-google p-8 text-center scale-in" style={{transitionDelay: '0.5s'}}>
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-headset text-white text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Email Support</h3>
                            <p className="text-gray-600">Get help when you need it. Our support team is ready to assist you with any questions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section bg-green-600 text-white">
                <div className="container-google">
                    <div className="max-w-4xl mx-auto text-center fade-in">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to experience these features?
                        </h2>
                        <p className="text-xl text-green-50 mb-8">
                            Create your first election and see how easy it is
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
