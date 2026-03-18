import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
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
import PresupuestoPublico from './pages/PresupuestoPublico';
import Notificaciones from './pages/Notificaciones';

// Páginas de administración
import AdminTrabajos from './pages/AdminTrabajos';
import AdminFallos from './pages/AdminFallos';
import AdminFamilias from './pages/AdminFamilias';
import AdminFamiliasFallos from './pages/AdminFamiliasFallos';

function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/presupuesto/:token" element={<PresupuestoPublico />} />
          
          {/* Rutas privadas */}
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
                        {/* Rutas principales */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/nueva-recepcion" element={<NuevaRecepcion />} />
                        <Route path="/reparacion/:id" element={<DetalleReparacion />} />
                        <Route path="/reparaciones-activas" element={<ReparacionesActivas />} />
                        <Route path="/historial" element={<Historial />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/notificaciones" element={<Notificaciones />} />
                        
                        {/* Rutas de administración */}
                        <Route path="/admin-trabajos" element={<AdminTrabajos />} />
                        <Route path="/admin-fallos" element={<AdminFallos />} />
                        <Route path="/admin-familias" element={<AdminFamilias />} />
                        <Route path="/admin-familias-fallos" element={<AdminFamiliasFallos />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </NotificationProvider>
    </AppProvider>
  );
}

export default App;