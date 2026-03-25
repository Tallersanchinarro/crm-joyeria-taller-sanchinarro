import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings,
  Gem,
  PlusCircle,
  History,
  Clock,
  Menu,
  LogOut,
  FileText,
  Wrench,
  Receipt,
  FolderTree,
  AlertTriangle,
  ListTodo
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

function Sidebar() {
  const navigate = useNavigate();
  const { orders } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);

  // Cargar configuración de la empresa
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data: config, error } = await supabase
          .from('configuracion')
          .select('*')
          .single();

        if (!error && config && config.logo_url) {
          setLogoUrl(config.logo_url);
        }
      } catch (error) {
        console.log('Usando logo por defecto');
      }
    };
    loadConfig();
  }, []);

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
    //{ icon: PlusCircle, label: 'Nueva Recepción', path: '/nueva-recepcion' },
    { icon: Package, label: 'Activas', path: '/reparaciones-activas', badge: activeOrders > 0 ? activeOrders : null },
    { icon: Clock, label: 'Listas', path: '/reparaciones-activas?estado=listo', badge: readyOrders > 0 ? readyOrders : null },
    { icon: History, label: 'Historial', path: '/historial' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: Receipt, label: 'Facturación', path: '/facturacion' }
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
        className="lg:hidden fixed top-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          bg-white border-r border-gray-200
          shadow-lg transition-all duration-300 ease-in-out
          flex flex-col h-screen
          ${isExpanded ? 'lg:w-64' : 'lg:w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo - Cuando está expandido muestra imagen grande, cuando colapsado muestra gema */}
        <div className="flex items-center justify-center py-6 border-b border-gray-100">
          {isExpanded ? (
            // Expandido: muestra el logo grande ocupando todo el ancho
            logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full max-w-[160px] h-auto object-contain px-4"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <Gem className="w-12 h-12 text-primary-600" />
            )
          ) : (
            // Colapsado: muestra solo la gema
            <Gem className="w-8 h-8 text-primary-600" />
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
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={!isExpanded ? item.label : ''}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
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
              <p className="text-xs font-medium text-gray-400 px-3 mb-2">ADMINISTRACIÓN</p>
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
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
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
              <p className="text-xs font-medium text-gray-400 px-3 mb-2">SISTEMA</p>
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
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
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

        {/* Footer con perfil y logout */}
        <div className="border-t border-gray-200 p-3">
          {isExpanded ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">L</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">TALLER JOYERIA</p>
                  <p className="text-xs text-gray-400 truncate"></p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex justify-center w-full p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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