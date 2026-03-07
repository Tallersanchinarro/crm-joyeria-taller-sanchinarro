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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

function Sidebar() {
  const navigate = useNavigate();
  const { orders, clients } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Contadores para el menú
  const activeOrders = orders.filter(o => 
    o.status !== 'Entregado' && 
    o.status !== 'Archivado' && 
    o.status !== 'Rechazado'
  ).length;
  
  const readyOrders = orders.filter(o => o.status === 'Listo').length;
  const pendingBudget = orders.filter(o => o.status === 'Presupuestado').length;
  const inAnalysis = orders.filter(o => o.status === 'En análisis').length;
  const totalClients = clients.length;

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      description: 'Visión general'
    },
    { 
      icon: PlusCircle, 
      label: 'Nueva Recepción', 
      path: '/nueva-recepcion',
      description: 'Registrar entrada',
      highlight: true,
      color: 'green'
    },
    { 
      icon: Package, 
      label: 'En Recepción', 
      path: '/reparaciones-activas?estado=recibido',
      count: orders.filter(o => o.status === 'Recibido').length,
      description: 'Pendientes análisis',
      color: 'purple'
    },
    { 
      icon: Wrench, 
      label: 'En Análisis', 
      path: '/reparaciones-activas?estado=analisis',
      count: inAnalysis,
      description: 'Joyero examinando',
      color: 'blue',
      alert: inAnalysis > 0
    },
    { 
      icon: FileText, 
      label: 'Presupuestos', 
      path: '/reparaciones-activas?estado=presupuestado',
      count: pendingBudget,
      description: 'Esperando cliente',
      color: 'yellow',
      alert: pendingBudget > 0
    },
    { 
      icon: Clock, 
      label: 'Listas para Entregar', 
      path: '/reparaciones-activas?estado=listo',
      count: readyOrders,
      description: 'Esperando recogida',
      color: 'green',
      alert: readyOrders > 0
    },
    { 
      icon: History, 
      label: 'Historial', 
      path: '/historial',
      description: 'Completadas'
    },
    { 
      icon: Users, 
      label: 'Clientes', 
      path: '/clientes',
      count: totalClients,
      description: 'Base de datos'
    },
    { 
      icon: BarChart3, 
      label: 'Reportes', 
      path: '/reportes',
      description: 'Estadísticas'
    }
  ];

  const bottomMenuItems = [
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
    { icon: HelpCircle, label: 'Ayuda', path: '/ayuda' }
  ];

  // Cerrar móvil al navegar
  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Botón de menú para móvil */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        bg-gradient-to-b from-white to-gray-50
        shadow-2xl lg:shadow-xl
        transition-all duration-300 ease-in-out
        flex flex-col h-screen
        ${isCollapsed ? 'lg:w-20' : 'lg:w-80'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Botón de colapsar (solo desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all z-10"
        >
          {isCollapsed ? 
            <ChevronRight className="w-4 h-4 text-gray-600" /> : 
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          }
        </button>

        {/* Logo y cabecera */}
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="flex items-center space-x-3 group flex-1"
            >
              <div className={`
                bg-gradient-to-br from-primary-500 to-primary-600 
                rounded-xl flex items-center justify-center 
                shadow-lg group-hover:shadow-xl transition-all
                ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}
              `}>
                <Gem className={`text-white ${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1">
                  <h1 className="text-xl font-bold">
                    <span className="text-primary-600">Orfebre</span>
                    <span className="text-gray-800">CRM</span>
                  </h1>
                  <p className="text-xs text-gray-500">Taller de Joyería</p>
                </div>
              )}
            </button>

            {/* Botón cerrar móvil */}
            <button 
              onClick={() => setIsMobileOpen(false)} 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Resumen rápido (solo expandido) */}
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

          {/* Badge simple si está colapsado */}
          {isCollapsed && (
            <div className="mt-4 flex flex-col items-center space-y-2">
              <div className="bg-purple-100 rounded-full px-2 py-1">
                <span className="text-xs font-bold text-purple-700">
                  {orders.filter(o => o.status === 'Recibido').length}
                </span>
              </div>
              <div className="bg-blue-100 rounded-full px-2 py-1">
                <span className="text-xs font-bold text-blue-700">{inAnalysis}</span>
              </div>
            </div>
          )}
        </div>

        {/* Barra de búsqueda (solo expandido) */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar rápido..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* Navegación principal */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isHighlight = item.highlight;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsMobileOpen(false);
                  }}
                  className={({ isActive }) => `
                    flex items-center justify-between rounded-xl transition-all duration-200 relative group
                    ${isCollapsed ? 'px-3 py-3' : 'px-4 py-3'}
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                      : isHighlight
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${
                      isHighlight ? 'text-green-600' : ''
                    }`} />
                    
                    {!isCollapsed && (
                      <div className="truncate">
                        <span className="text-sm font-medium block truncate">{item.label}</span>
                        {item.description && (
                          <p className={`text-xs truncate ${
                            isHighlight ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tooltip para modo colapsado */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        {item.label}
                        {item.count > 0 && ` (${item.count})`}
                      </span>
                    )}
                  </div>
                  
                  {/* Badges y contadores */}
                  {!isCollapsed && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {item.count > 0 && (
                        <span className={`
                          min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center
                          ${item.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
                          ${item.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                          ${item.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${item.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                          ${!item.color ? 'bg-gray-200 text-gray-700' : ''}
                        `}>
                          {item.count}
                        </span>
                      )}
                      {item.alert && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                  )}

                  {/* Badge simplificado para modo colapsado */}
                  {isCollapsed && item.count > 0 && (
                    <span className={`
                      absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] text-white 
                      flex items-center justify-center border-2 border-white
                      ${item.color === 'purple' ? 'bg-purple-500' : ''}
                      ${item.color === 'blue' ? 'bg-blue-500' : ''}
                      ${item.color === 'yellow' ? 'bg-yellow-500' : ''}
                      ${item.color === 'green' ? 'bg-green-500' : ''}
                      ${!item.color ? 'bg-gray-500' : ''}
                    `}>
                      {item.count > 9 ? '9+' : item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Separador */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* Menú inferior */}
          <div className="space-y-1">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsMobileOpen(false);
                  }}
                  className={({ isActive }) => `
                    flex items-center space-x-3 rounded-xl transition-all duration-200 relative group
                    ${isCollapsed ? 'px-3 py-3' : 'px-4 py-3'}
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}

                  {/* Tooltip para modo colapsado */}
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Perfil y notificaciones */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white font-bold text-sm">TJ</span>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-800 truncate">Taller Joyería</p>
                    <p className="text-xs text-gray-500 truncate">Plan Profesional</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                    <Bell className="w-4 h-4 text-gray-500" />
                    {pendingBudget > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* Versión */}
              <p className="text-xs text-center text-gray-400">
                Versión 2.0.0 · Taller de Joyería
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">TJ</span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-4 h-4 text-gray-500" />
                {pendingBudget > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Estilos para scrollbar personalizada */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 20px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  );
}

export default Sidebar;