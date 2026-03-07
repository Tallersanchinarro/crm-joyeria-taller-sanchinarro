import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, PlusCircle, Menu } from 'lucide-react';

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/reparaciones-activas?buscar=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Menú hamburguesa para móvil */}
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Logo para móvil */}
        <div className="lg:hidden flex items-center">
          <span className="text-xl font-bold text-primary-600">Orfebre</span>
          <span className="text-xl font-bold text-gray-800">CRM</span>
        </div>

        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-2xl mx-auto lg:mx-0 lg:ml-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar orden, cliente, joya..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Acciones */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/nueva-recepcion')}
            className="hidden md:flex btn-primary items-center space-x-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Nueva recepción</span>
          </button>
          
          <button 
            onClick={() => navigate('/nueva-recepcion')}
            className="md:hidden btn-primary p-2"
            aria-label="Nueva recepción"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
          
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