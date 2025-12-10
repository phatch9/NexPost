import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ReddotSidebar from './ReddotSidebar';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-reddit-gray">
      <Navbar />
      <div className="pt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            <main className="w-full md:w-2/3 lg:w-3/4">
              <Outlet />
            </main>
            <aside className="w-full md:w-1/3 lg:w-1/4">
              <ReddotSidebar />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
