import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DonationTypeSelection from './DonationTypeSelection';
import DonationAdminList from './DonationAdminList';

const DonationList = () => {
    const { user } = useAuth();
    // ADMIN = 1, SUPER_ADMIN = 2
    const isAdmin = user?.role === 1 || user?.role === 2;

    return isAdmin ? <DonationAdminList /> : <DonationTypeSelection />;
};

export default DonationList;
