
import React from 'react';
import { Coach } from '../../types';

interface CoachCardProps {
    coach: Coach;
}

const CoachCard: React.FC<CoachCardProps> = ({ coach }) => {
    return (
        <div className="bg-brand-gray rounded-lg overflow-hidden shadow-lg p-6 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300">
            <img className="w-32 h-32 rounded-full object-cover border-4 border-brand-red mb-4" src={coach.imageUrl} alt={coach.name} />
            <h3 className="text-xl font-bold text-white">{coach.name}</h3>
            <p className="text-brand-red font-semibold">{coach.level}</p>
            <p className="text-gray-300 mt-2 text-sm">{coach.bio}</p>
        </div>
    )
}

export default CoachCard;
