import React from 'react';
import Header from '../components/Header';
import StatCards from '../components/StatCards';
import KanbanBoard from '../components/KanbanBoard';

export default function ApplicationsPage() {
  return (
    <>
      <Header />
      <StatCards />
      <KanbanBoard />
    </>
  );
}
