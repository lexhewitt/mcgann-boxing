
import React from 'react';
import { Coach } from '../../types';
import Button from './Button';

interface CoachCardProps {
    coach: Coach;
    showBookButton?: boolean;
}

const CoachCard: React.FC<CoachCardProps> = ({ coach, showBookButton = true }) => {
    const handleBookClick = () => {
        window.location.href = `/book?coach=${coach.id}`;
    };

    return (
        <div className="bg-brand-gray rounded-lg overflow-hidden shadow-lg p-6 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300">
            <img 
                className="w-32 h-32 rounded-full object-cover border-4 border-brand-red mb-4" 
                src={coach.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.name}`} 
                alt={coach.name} 
            />
            <h3 className="text-xl font-bold text-white">{coach.name}</h3>
            <p className="text-brand-red font-semibold">{coach.level}</p>
            <p className="text-gray-300 mt-2 text-sm mb-4">{coach.bio}</p>
            {showBookButton && (
                <Button 
                    onClick={handleBookClick}
                    className="w-full mt-auto"
                    variant="secondary"
                >
                    Book with {coach.name}
                </Button>
            )}
        </div>
    )
}

export default CoachCard;
