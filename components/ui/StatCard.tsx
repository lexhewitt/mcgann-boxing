import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-brand-dark p-6 rounded-lg shadow-lg flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-bold text-white mt-1">{value}</p>
      </div>
      {icon && (
        <div className="bg-brand-gray p-3 rounded-full">
            {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
