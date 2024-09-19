import React from 'react';
import ServiceMap from '../components/ServiceMap';
import ServiceList from '../components/ServiceList';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navbar-bg shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Service Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Service Map</h2>
          <div className="card p-4">
            <ServiceMap />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Service List</h2>
          <ServiceList />
        </div>
      </main>
    </div>
  );
};

export default Home;
