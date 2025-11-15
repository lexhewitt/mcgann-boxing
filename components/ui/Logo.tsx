import React from 'react';
import { logoBase64 } from '../../assets/logo';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
    return (
        <img 
            src={logoBase64} 
            alt="Fleetwood Boxing Gym Logo"
            className={className}
        />
    )
}

export default Logo;