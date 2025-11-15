
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black mt-12">
      <div className="container mx-auto py-6 px-4 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} Fleetwood Boxing Gym. All Rights Reserved.</p>
        <p className="text-sm mt-2">Built for champions, by champions.</p>
      </div>
    </footer>
  );
};

export default Footer;
