import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import NuevaRecepcion from './pages/NuevaRecepcion';
import DetalleReparacion from './pages/DetalleReparacion';
import ReparacionesActivas from './pages/ReparacionesActivas';
import Historial from './pages/Historial';
import Clientes from './pages/Clients';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/nueva-recepcion" element={<NuevaRecepcion />} />
              <Route path="/reparacion/:id" element={<DetalleReparacion />} />
              <Route path="/reparaciones-activas" element={<ReparacionesActivas />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/clientes" element={<Clientes />} />
            </Routes>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;