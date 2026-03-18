import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  PlusCircle, 
  Menu,
  CheckCircle,
  XCircle,
  CheckCheck,
  X,
  Mail
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  
  let notifications = [];
  let unreadCount = 0;
  let markAsRead = () => {};

  try {
    const context = useNotifications();
    notifications = context.notifications;
    unreadCount = context.unreadCount;
    markAsRead = context.markAsRead;
  } catch (e) {
    // Contexto no listo
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/reparaciones-activas?buscar=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Menú hamburguesa */}
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Logo móvil */}
        <div className="lg:hidden flex items-center">
          <span className="text-xl font-bold text-primary-600">LAM</span>
          <span className="text-xl font-bold text-gray-800">CRM</span>
        </div>

        {/* Búsqueda */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-2xl mx-auto lg:mx-0 lg:ml-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar orden, cliente, joya..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </form>

        {/* Acciones */}
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/nueva-recepcion')} className="hidden md:flex btn-primary items-center space-x-2">
            <PlusCircle className="w-5 h-5" />
            <span>Nueva recepción</span>
          </button>
          
          <button onClick={() => navigate('/nueva-recepcion')} className="md:hidden btn-primary p-2">
            <PlusCircle className="w-5 h-5" />
          </button>
          
          {/* Notificaciones */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Panel de notificaciones */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[32rem] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-primary-500" />
                    Notificaciones
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => navigate('/notificaciones')}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-96">
                  {notifications.filter(n => !n.read).length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.filter(n => !n.read).slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            markAsRead(notif.id);
                            if (notif.orderId) navigate(`/reparacion/${notif.orderId}`);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              notif.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {notif.type === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.filter(n => !n.read).length > 5 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button
                      onClick={() => {
                        navigate('/notificaciones');
                        setShowNotifications(false);
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Ver {notifications.filter(n => !n.read).length - 5} notificaciones más
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Búsqueda móvil */}
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </form>
    </header>
  );
}

export default Header;