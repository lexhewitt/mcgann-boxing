
import React, { ReactNode } from 'react';

interface FeatureCardProps {
    icon: ReactNode;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
        <div className="bg-brand-gray p-8 rounded-lg flex flex-col items-center transform hover:-translate-y-2 transition-transform duration-300">
            {icon}
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
};

export default FeatureCard;
