import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  X,
  Gem,
  PlusCircle,
  History,
  Clock,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  HelpCircle,
  FileText,
  Wrench,
  CheckCircle,
  AlertCircle,
  FolderTree,
  ListTodo,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

function Sidebar() {
  const navigate = useNavigate();
  const { orders, clients } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Contadores para el menú
  const inAnalysis = orders.filter(o => o.status === 'En análisis').length;
  const readyOrders = orders.filter(o => o.status === 'Listo').length;

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: PlusCircle, label: 'Nueva Recepción', path: '/nueva-recepcion', highlight: true },
    { icon: Package, label: 'En Recepción', path: '/reparaciones-activas?estado=recibido' },
    { icon: Wrench, label: 'En Análisis', path: '/reparaciones-activas?estado=analisis' },
    { icon: FileText, label: 'Presupuestos', path: '/reparaciones-activas?estado=presupuestado' },
    { icon: Clock, label: 'Listas', path: '/reparaciones-activas?estado=listo' },
    { icon: History, label: 'Historial', path: '/historial' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: BarChart3, label: 'Reportes', path: '/reportes' }
  ];

  const adminMenuItems = [
    { icon: FolderTree, label: 'Familias', path: '/admin-familias' },
    { icon: ListTodo, label: 'Trabajos', path: '/admin-trabajos' },
    { icon: AlertTriangle, label: 'Fam. Fallos', path: '/admin-familias-fallos' },
    { icon: AlertCircle, label: 'Fallos', path: '/admin-fallos' }
  ];

  const bottomMenuItems = [
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
    { icon: HelpCircle, label: 'Ayuda', path: '/ayuda' }
  ];

  return (
    <>
      {/* Botón de menú para móvil */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        bg-gradient-to-b from-white to-gray-50
        shadow-2xl lg:shadow-xl
        transition-all duration-300
        flex flex-col h-screen
        ${isCollapsed ? 'lg:w-20' : 'lg:w-80'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Botón de colapsar */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md z-10"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <button onClick={() => { navigate('/dashboard'); setIsMobileOpen(false); }} className="flex items-center space-x-3">
              <div className={`bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
                <Gem className={`text-white ${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-bold">
                    <span className="text-primary-600">LAM</span>
                    <span className="text-gray-800">CRM</span>
                  </h1>
                  <p className="text-xs text-gray-500">Taller de Joyería</p>
                </div>
              )}
            </button>
            <button onClick={() => setIsMobileOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isCollapsed && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-xs text-purple-600">Recibidas</p>
                <p className="text-lg font-bold text-purple-700">
                  {orders.filter(o => o.status === 'Recibido').length}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-xs text-blue-600">Análisis</p>
                <p className="text-lg font-bold text-blue-700">{inAnalysis}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-xs text-green-600">Listas</p>
                <p className="text-lg font-bold text-green-700">{readyOrders}</p>
              </div>
            </div>
          )}
        </div>

        {/* Búsqueda */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-lg" />
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Menú principal */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-3 rounded-xl transition-all mb-1
                  ${isCollapsed ? 'px-3 py-3' : 'px-4 py-3'}
                  ${isActive 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                    : item.highlight
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}

          {/* Separador */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* Administración */}
          {!isCollapsed && <p className="text-xs font-semibold text-gray-400 px-4 mb-2">ADMINISTRACIÓN</p>}
          
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-3 rounded-xl transition-all mb-1
                  ${isCollapsed ? 'px-3 py-3' : 'px-4 py-3'}
                  ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}

          {/* Separador */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* Configuración */}
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-3 rounded-xl transition-all mb-1
                  ${isCollapsed ? 'px-3 py-3' : 'px-4 py-3'}
                  ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Perfil */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LAM</span>
                </div>
                <div>
                  <p className="text-sm font-medium">LAM RELOJEROS</p>
                  <p className="text-xs text-gray-500">Plan Profesional</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;