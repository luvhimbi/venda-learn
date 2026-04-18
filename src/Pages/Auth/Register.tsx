import React from 'react';
import Onboarding from './Onboarding';

const Register: React.FC = () => {
    // We moved the entire registration flow inside the Onboarding component
    // to provide a single, seamless flow! 
    // Now /register simply delegates completely to Onboarding.
    return <Onboarding />;
};

export default Register;
