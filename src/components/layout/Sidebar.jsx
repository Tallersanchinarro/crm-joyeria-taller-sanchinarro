import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings,
  Gem,
  History,
  Clock,
  Menu,
  LogOut,
  Receipt,
  FolderTree,
  ListTodo,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

function Sidebar() {
  const navigate = useNavigate();
  const { orders } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [avisosCount, setAvisosCount] = useState(0);

  // Calcular avisos pendientes (órdenes en estado 'Listo' con más de 7 días sin notificar)
  useEffect(() => {
    const calcularAvisos = () => {
      const sieteDiasAtras = new Date();
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
      
      const count = orders.filter(o => 
        o.status === 'Listo' && 
        !o.notified && 
        o.completed_at && 
        new Date(o.completed_at) <= sieteDiasAtras
      ).length;
      
      setAvisosCount(count);
    };
    
    calcularAvisos();
  }, [orders]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Contadores para el menú
  const activeOrders = orders.filter(o => 
    o.status !== 'Entregado' && o.status !== 'Rechazado' && o.status !== 'Archivado'
  ).length;
  const readyOrders = orders.filter(o => o.status === 'Listo').length;

  // Menú principal
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Activas', path: '/reparaciones-activas', badge: activeOrders > 0 ? activeOrders : null },
    { icon: Clock, label: 'Terminadas', path: '/reparaciones-activas?estado=listo', badge: readyOrders > 0 ? readyOrders : null },
    { icon: History, label: 'Historial', path: '/historial' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: Receipt, label: 'Facturación', path: '/facturacion' },
    { icon: Bell, label: 'Avisos Pendientes', path: '/avisos-pendientes', badge: avisosCount > 0 ? avisosCount : null }
  ];

  // Administración
  const adminItems = [
    { icon: FolderTree, label: 'Familias Trabajos', path: '/admin-familias' },
    { icon: ListTodo, label: 'Trabajos', path: '/admin-trabajos' },
    { icon: FolderTree, label: 'Familias Fallos', path: '/admin-familias-fallos' },
    { icon: AlertTriangle, label: 'Fallos', path: '/admin-fallos' }
  ];

  // Configuración
  const bottomItems = [
    { icon: Settings, label: 'Configuración', path: '/configuracion' }
  ];

  return (
    <>
      {/* Botón de menú para móvil */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md border border-gray-300"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar - Diseño blanco y negro */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          bg-white border-r border-gray-200
          shadow-xl transition-all duration-300 ease-in-out
          flex flex-col h-screen
          ${isExpanded ? 'w-64' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo - Versión simplificada sin imagen */}
        <div className="flex items-center justify-center py-6 border-b border-gray-200">
          {isExpanded ? (
            <div className="flex items-center space-x-2">
              <Gem className="w-8 h-8 text-gray-800" />
              <span className="text-xl font-bold tracking-tight text-gray-800">TALLER</span>
            </div>
          ) : (
            <Gem className="w-8 h-8 text-gray-800" />
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center rounded-lg transition-all duration-200
                  ${isExpanded ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'}
                  ${isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={!isExpanded ? item.label : ''}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}

          {/* Separador Administración */}
          {isExpanded && (
            <div className="pt-4 mt-2 border-t border-gray-200">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Administración</p>
            </div>
          )}

          {/* Items de administración */}
          {adminItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center rounded-lg transition-all duration-200
                  ${isExpanded ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'}
                  ${isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={!isExpanded ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}

          {/* Separador Configuración */}
          {isExpanded && (
            <div className="pt-4 mt-2 border-t border-gray-200">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Sistema</p>
            </div>
          )}

          {/* Items de configuración */}
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center rounded-lg transition-all duration-200
                  ${isExpanded ? 'justify-start space-x-3 px-3 py-2.5' : 'justify-center p-2.5'}
                  ${isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={!isExpanded ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer con perfil y logout - Estilo blanco y negro */}
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          {isExpanded ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">L</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">TALLER</p>
                  <p className="text-xs text-gray-500 truncate">Joyas y Relojes</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex justify-center w-full p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;