import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCards from './components/StatCards';
import KanbanBoard from './components/KanbanBoard';

export default function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="content-wrapper">
          <Header />
          <StatCards />
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}
