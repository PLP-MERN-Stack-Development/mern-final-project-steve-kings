"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import MobileMenu from '@/components/MobileMenu';

export default function HomePage() {
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
        <div className="min-h-screen bg-white font-sans">
            {/* Navigation */}
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
                            <Link href="/pricing" className="btn-primary">
                                Get Started Free
                            </Link>
                        </div>
                        <MobileMenu />
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="section relative overflow-hidden pt-20 pb-32">
                {/* Background decoration */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/4"></div>
                </div>

                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="fade-in">
                            <div className="inline-block mb-6">
                                <span className="badge badge-info px-4 py-1.5 text-sm">
                                    <i className="fas fa-star mr-2 text-yellow-500"></i>
                                    The #1 Election Platform
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                                Make Every <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">
                                    Vote Count
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                                The simplest way to run secure, transparent elections for your organization. From student councils to community polls.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/pricing" className="btn-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                                    Get Started Free
                                </Link>
                                <Link href="/how-it-works" className="bg-white border-2 border-gray-200 text-gray-700 hover:border-green-600 hover:text-green-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all inline-flex items-center gap-2">
                                    <i className="fas fa-play-circle"></i>
                                    See How It Works
                                </Link>
                            </div>
                            <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden">
                                            <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} width={32} height={32} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <p>Trusted by 100+ organizations</p>
                            </div>
                        </div>
                        <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl scale-in border-8 border-white/50 backdrop-blur-sm">
                            <Image
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                                alt="PollSync Dashboard Interface"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Floating UI Elements */}
                            <div className="absolute top-10 right-10 bg-white p-4 rounded-xl shadow-lg animate-bounce duration-[3000ms]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Votes Cast</div>
                                        <div className="font-bold text-gray-900">1,245</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="section bg-gray-50" id="how-it-works">
                <div className="container-google">
                    <div className="text-center mb-16 fade-in">
                        <span className="text-green-600 font-semibold tracking-wider uppercase text-sm">Simple Workflow</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">
                            How PollSync Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Get your election up and running in minutes, not days.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Create Election',
                                desc: 'Set up your election details in 3 clicks.',
                                icon: 'fa-edit'
                            },
                            {
                                step: '02',
                                title: 'Add Candidates',
                                desc: 'Add profiles, photos, and manifestos.',
                                icon: 'fa-users'
                            },
                            {
                                step: '03',
                                title: 'Share Link',
                                desc: 'Send secure voting links to your voters.',
                                icon: 'fa-share-alt'
                            },
                            {
                                step: '04',
                                title: 'Live Results',
                                desc: 'Watch the votes come in real-time.',
                                icon: 'fa-chart-pie'
                            }
                        ].map((item, index) => (
                            <div key={index} className="relative group fade-in" style={{ transitionDelay: `${index * 0.1}s` }}>
                                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
                                    <div className="text-6xl font-bold text-gray-100 absolute top-4 right-4 group-hover:text-green-50 transition-colors">
                                        {item.step}
                                    </div>
                                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600 text-2xl mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <i className={`fas ${item.icon}`}></i>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{item.title}</h3>
                                    <p className="text-gray-600 relative z-10">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="section" id="features">
                <div className="container-google">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1 relative h-[600px] slide-in-left">
                            <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-orange-100 rounded-3xl transform -rotate-3"></div>
                            <Image
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                                alt="Real-time Analytics"
                                fill
                                className="object-cover rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500"
                            />
                        </div>
                        <div className="order-1 md:order-2 fade-in">
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Everything you need for <br />
                                <span className="text-green-600">Flawless Elections</span>
                            </h2>

                            <div className="space-y-8">
                                {[
                                    {
                                        title: 'Simplicity First',
                                        desc: 'Setup in 10 minutes. Intuitive design that requires no training.',
                                        icon: 'fa-magic'
                                    },
                                    {
                                        title: 'Secure & Transparent',
                                        desc: 'Unique voter IDs, one vote per person, and encrypted data.',
                                        icon: 'fa-shield-alt'
                                    },
                                    {
                                        title: 'Real-Time Analytics',
                                        desc: 'Visualize results instantly with beautiful charts and graphs.',
                                        icon: 'fa-chart-bar'
                                    },
                                    {
                                        title: 'Accessible Everywhere',
                                        desc: 'Works on any device - phone, tablet, or computer.',
                                        icon: 'fa-mobile-alt'
                                    }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex-shrink-0 flex items-center justify-center text-green-600 text-xl">
                                            <i className={`fas ${feature.icon}`}></i>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
                                            <p className="text-gray-600">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section bg-green-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute left-0 bottom-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
                </div>

                <div className="container-google relative z-10">
                    <div className="text-center max-w-4xl mx-auto fade-in">
                        <div className="text-6xl text-green-400 mb-8 opacity-50">
                            <i className="fas fa-quote-left"></i>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                            "PollSync increased our voter turnout from 45% to 92%. Students loved how easy it was to vote from their phones!"
                        </h2>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full border-2 border-green-400 overflow-hidden">
                                <Image
                                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
                                    width={64}
                                    height={64}
                                    alt="Sarah"
                                />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-xl">Sarah Johnson</div>
                                <div className="text-green-300">CS Club President</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section bg-white">
                <div className="container-google">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-3xl p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden scale-in">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-6 relative z-10">
                            Ready to Start Your Story?
                        </h2>
                        <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto relative z-10">
                            Join thousands of organizations making democratic decisions with PollSync.
                        </p>
                        <div className="relative z-10">
                            <Link href="/pricing" className="bg-white text-green-600 hover:bg-gray-50 px-10 py-5 rounded-full font-bold text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2">
                                Get Started Now
                                <i className="fas fa-arrow-right"></i>
                            </Link>
                            <p className="mt-4 text-sm text-green-100 opacity-80">
                                No credit card required • Cancel anytime
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 pt-20 pb-10 border-t border-gray-200">
                <div className="container-google">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <Link href="/" className="flex items-center space-x-2 mb-6">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-vote-yea text-white text-sm"></i>
                                </div>
                                <span className="text-xl font-bold text-gray-900">PollSync</span>
                            </Link>
                            <p className="text-gray-600 mb-6">
                                Empowering democratic decisions for organizations everywhere.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-green-600 shadow-sm hover:shadow-md transition-all">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-green-600 shadow-sm hover:shadow-md transition-all">
                                    <i className="fab fa-linkedin-in"></i>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-green-600 shadow-sm hover:shadow-md transition-all">
                                    <i className="fab fa-instagram"></i>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Product</h4>
                            <ul className="space-y-4 text-gray-600">
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Features</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Pricing</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Security</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Roadmap</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
                            <ul className="space-y-4 text-gray-600">
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Help Center</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Guides</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">API Documentation</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Status</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Company</h4>
                            <ul className="space-y-4 text-gray-600">
                                <li><Link href="#" className="hover:text-green-600 transition-colors">About Us</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Careers</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Blog</Link></li>
                                <li><Link href="#" className="hover:text-green-600 transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-500 text-sm mb-4 md:mb-0">
                            &copy; 2025 PollSync. Developed by kingscreation.co.ke 2025
                        </p>
                        <div className="flex space-x-8 text-sm text-gray-500">
                            <Link href="#" className="hover:text-green-600">Privacy Policy</Link>
                            <Link href="#" className="hover:text-green-600">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

