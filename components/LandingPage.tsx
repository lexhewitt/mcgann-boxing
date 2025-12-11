
import React from 'react';
import { useData } from '../context/DataContext';
import ClassSchedule from './dashboard/ClassSchedule';
import CoachCard from './ui/CoachCard';
import Button from './ui/Button';
import FeatureCard from './ui/FeatureCard';

// Icons for Feature Cards
const MedalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);
const DumbbellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
         <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
);
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

interface LandingPageProps {
  onRegisterClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onRegisterClick }) => {
    const { coaches } = useData();

    return (
        <div className="space-y-24">
            {/* Hero Section */}
            <div className="relative -mt-8 -mx-4 h-screen flex items-center justify-center text-center text-white">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594735518069-1731119b2633?q=80&w=1920&auto=format&fit=crop')" }}
                ></div>
                <div className="absolute inset-0 bg-black/70"></div>
                <div className="relative px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        Forge Your Strength at <span className="text-brand-red">Fleetwood Boxing</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
                        Whether you're a beginner or a seasoned pro, our world-class coaches and community are here to help you achieve your goals.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Button 
                            onClick={() => window.location.href = '/book'} 
                            className="text-lg px-8 py-3"
                        >
                            Book a Class or Session
                        </Button>
                        <Button 
                            onClick={onRegisterClick} 
                            variant="secondary"
                            className="text-lg px-8 py-3"
                        >
                            Join Now
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Features Section */}
            <section>
                <h2 className="text-3xl font-bold text-center mb-12 text-white">Why Choose Fleetwood Boxing?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <FeatureCard 
                        icon={<MedalIcon />}
                        title="Expert Coaches"
                        description="Learn from certified, experienced professionals dedicated to your success and safety."
                    />
                    <FeatureCard 
                        icon={<DumbbellIcon />}
                        title="Modern Facility"
                        description="Train with top-of-the-line equipment in a clean, motivating, and well-maintained environment."
                    />
                     <FeatureCard 
                        icon={<UsersIcon />}
                        title="Supportive Community"
                        description="Join a family of like-minded individuals who will support and push you to be your best."
                    />
                </div>
            </section>
            
            {/* Class Schedule Section */}
            <section>
                <h2 className="text-3xl font-bold text-center mb-8 text-white">Class Schedule</h2>
                <ClassSchedule />
            </section>

            {/* Coaches Section */}
            <section>
                 <h2 className="text-3xl font-bold text-center mb-8 text-white">Meet Our Coaches</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     {coaches.map(coach => (
                         <CoachCard key={coach.id} coach={coach} showBookButton={true} />
                     ))}
                 </div>
            </section>

            {/* Book Now CTA Section */}
            <section className="bg-brand-gray rounded-3xl p-12 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                    Book a class or private session with one of our expert coaches. No membership required - pay as you go!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                        onClick={() => window.location.href = '/book'} 
                        className="text-lg px-8 py-3"
                    >
                        Book a Class or Session
                    </Button>
                    <Button 
                        onClick={onRegisterClick} 
                        variant="secondary"
                        className="text-lg px-8 py-3"
                    >
                        Become a Member
                    </Button>
                </div>
            </section>
        </div>
    )
}

export default LandingPage;
