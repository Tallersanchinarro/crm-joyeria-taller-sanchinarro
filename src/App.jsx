import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevaRecepcion from './pages/NuevaRecepcion';
import DetalleReparacion from './pages/DetalleReparacion';
import ReparacionesActivas from './pages/ReparacionesActivas';
import Historial from './pages/Historial';
import Clientes from './pages/Clientes';

function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Única ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Todas las demás rutas son privadas */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Header />
                  <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppProvider>
  );
}

export default App;