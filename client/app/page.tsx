"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import MobileMenu from '@/components/MobileMenu';

// Testimonials data
const testimonials = [
    {
        quote: "PollSync transformed our university elections! The platform is incredibly intuitive, and students loved voting from their phones. Our turnout skyrocketed from 45% to 92%!",
        name: "Agnes",
        role: "Nature Club",
        image: "/testimonials/happy.jpg"
    },
    {
        quote: "Running our club elections has never been easier. The real-time results feature saved us hours of manual counting. Absolutely game-changing!",
        name: "Mannuh",
        role: "Journalism Club",
        image: "/testimonials/happy.jpg"
    },
    {
        quote: "Security was our biggest concern, but PollSync exceeded all expectations. The unique voter ID system ensured complete transparency and trust.",
        name: "Pierra",
        role: "Christian Union",
        image: "/testimonials/happy.jpg"
    },
    {
        quote: "We managed 5,000+ voters seamlessly! The CSV upload feature and automated voter ID generation made setup incredibly fast. Highly recommend!",
        name: "Kidiki",
        role: "Drama Club",
        image: "/testimonials/happy.jpg"
    },
    {
        quote: "The mobile experience is flawless. Students could vote during breaks, between classes, anywhere. This is the future of student elections!",
        name: "Grace N.",
        role: "Debate Society",
        image: "/testimonials/happy.jpg"
    }
];

function TestimonialsSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <section className="py-16 sm:py-20 md:py-24 bg-green-900 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute right-0 top-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                <div className="absolute left-0 bottom-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="text-6xl text-green-400 mb-8 opacity-50">
                        <i className="fas fa-quote-left"></i>
                    </div>
                    
                    {/* Testimonial Content */}
                    <div className="relative min-h-[300px] flex items-center justify-center">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-all duration-700 ${
                                    index === currentIndex 
                                        ? 'opacity-100 translate-x-0' 
                                        : index < currentIndex 
                                        ? 'opacity-0 -translate-x-full' 
                                        : 'opacity-0 translate-x-full'
                                }`}
                            >
                                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight px-4">
                                    "{testimonial.quote}"
                                </h2>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-green-400 overflow-hidden">
                                        <Image
                                            src={testimonial.image}
                                            width={64}
                                            height={64}
                                            alt={testimonial.name}
                                        />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-xl">{testimonial.name}</div>
                                        <div className="text-green-300">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Dots Navigation */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                    index === currentIndex 
                                        ? 'bg-white w-8' 
                                        : 'bg-white/40 hover:bg-white/60'
                                }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

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
        <div className="min-h-screen bg-white font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                                <i className="fas fa-vote-yea text-white text-base sm:text-xl"></i>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
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
            <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-32 px-4 sm:px-6 lg:px-8">
                {/* Background decoration */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-green-50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-orange-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/4"></div>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                        <div className="fade-in">
                            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
                                Transform Your Elections <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">
                                    Into Digital Success
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                                The complete platform for running secure, transparent online elections. Built for universities, student councils, clubs, organizations, and communities across Africa.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <Link href="/pricing" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all text-center">
                                    Get Started Free
                                </Link>
                                <Link href="/how-it-works" className="bg-white border-2 border-gray-200 text-gray-700 hover:border-green-600 hover:text-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all inline-flex items-center justify-center gap-2">
                                    <i className="fas fa-play-circle"></i>
                                    See How It Works
                                </Link>
                            </div>
                            <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden">
                                            <Image src={`/images/img${i}.png`} width={32} height={32} alt="Organization" />
                                        </div>
                                    ))}
                                </div>
                                <p>Trusted by 100+ organizations</p>
                            </div>
                        </div>
                        <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl scale-in border-4 sm:border-8 border-white/50 backdrop-blur-sm">
                            <Image
                                src="/images/img1.png"
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
            <section className="py-16 sm:py-20 md:py-24 bg-gray-50" id="how-it-works">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 fade-in">
                        <span className="text-green-600 font-semibold tracking-wider uppercase text-sm">Simple Workflow</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">
                            How PollSync Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Get your election up and running in minutes, not days.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Choose Your Plan',
                                desc: 'Select the perfect package for your voter capacity. Flexible pricing that grows with you.',
                                icon: 'fa-box'
                            },
                            {
                                step: '02',
                                title: 'Build Your Election',
                                desc: 'Create positions, add candidates with photos and manifestos. Our intuitive builder makes it effortless.',
                                icon: 'fa-edit'
                            },
                            {
                                step: '03',
                                title: 'Engage Voters',
                                desc: 'Share secure voting links via email, SMS, or social media. Voters participate from anywhere, anytime.',
                                icon: 'fa-share-alt'
                            },
                            {
                                step: '04',
                                title: 'Instant Analytics',
                                desc: 'Track turnout in real-time. Get comprehensive results the moment polls close.',
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
            <section className="py-16 sm:py-20 md:py-24" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
                        <div className="order-2 md:order-1 relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] slide-in-left">
                            <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-orange-100 rounded-3xl transform -rotate-3"></div>
                            <Image
                                src="/images/img2.png"
                                alt="Real-time Analytics"
                                fill
                                className="object-cover rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500"
                            />
                        </div>
                        <div className="order-1 md:order-2 fade-in">
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Everything You Need <br />
                                <span className="text-green-600">For Flawless Elections</span>
                            </h2>

                            <div className="space-y-8">
                                {[
                                    {
                                        title: 'Enterprise Security',
                                        desc: 'Bank-grade encryption, unique voter authentication, and fraud prevention. Your elections are protected 24/7.',
                                        icon: 'fa-shield-alt'
                                    },
                                    {
                                        title: 'Real-Time Intelligence',
                                        desc: 'Live turnout tracking, instant vote counting, and comprehensive analytics. Make data-driven decisions.',
                                        icon: 'fa-chart-line'
                                    },
                                    {
                                        title: 'Universal Access',
                                        desc: 'Mobile-first design that works flawlessly on any device. Voters participate from anywhere, anytime.',
                                        icon: 'fa-globe'
                                    },
                                    {
                                        title: 'Flexible Scaling',
                                        desc: 'From 10 to 10,000+ voters. Our platform grows with your needs. Pay only for what you use.',
                                        icon: 'fa-rocket'
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

            {/* Testimonials Slider */}
            <TestimonialsSlider />

            {/* CTA */}
            <section className="py-16 sm:py-20 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden scale-in">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-6 relative z-10">
                            Ready to Revolutionize Your Elections?
                        </h2>
                        <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto relative z-10">
                            Join hundreds of universities, student councils, and organizations running secure, transparent elections with confidence. Get started in minutes.
                        </p>
                        <div className="relative z-10">
                            <Link href="/pricing" className="bg-white text-green-600 hover:bg-gray-50 px-10 py-5 rounded-full font-bold text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2">
                                Get Started Now
                                <i className="fas fa-arrow-right"></i>
                            </Link>
                            <p className="mt-4 text-sm text-green-100 opacity-80">
                                Instant setup • Secure payments • 24/7 support
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 pt-12 sm:pt-20 pb-10 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
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
                            &copy; 2025 PollSync. Empowering Democratic Decisions Across Africa
                        </p>
                        <div className="flex space-x-8 text-sm text-gray-500">
                            <Link href="#" className="hover:text-green-600">Privacy Policy</Link>
                            <Link href="#" className="hover:text-green-600">Terms of Service</Link>
                            <Link href="#" className="hover:text-green-600">Contact Support</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

