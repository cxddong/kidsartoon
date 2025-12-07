import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../BottomNav';
import { AuthButton } from '../auth/AuthButton';

export const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            <main className="flex-1 pb-20"> {/* Add padding bottom for the fixed nav */}
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};
