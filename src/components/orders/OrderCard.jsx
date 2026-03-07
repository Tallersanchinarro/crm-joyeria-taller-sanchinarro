import React from 'react';
import { Clock, User, Tag, Camera, AlertCircle } from 'lucide-react';

function OrderCard({ order, onClick }) {
  const priorityColors = {
    'Baja': 'text-green-600 bg-green-50',
    'Normal': 'text-blue-600 bg-blue-50',
    'Alta': 'text-orange-600 bg-orange-50',
    'Urgente': 'text-red-600 bg-red-50'
  };

  const statusColors = {
    'Recibido': 'bg-purple-100 text-purple-700 border-purple-200',
    'En análisis': 'bg-blue-100 text-blue-700 border-blue-200',
    'Presupuestado': 'bg-amber-100 text-amber-700 border-amber-200',
    'Aceptado': 'bg-green-100 text-green-700 border-green-200',
    'En reparación': 'bg-orange-100 text-orange-700 border-orange-200',
    'Listo': 'bg-green-100 text-green-700 border-green-200'
  };

  const getDaysSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSince = getDaysSince(order.createdAt);
  const isOverdue = order.estimatedDate && new Date(order.estimatedDate) < new Date() && order.status !== 'Listo';

  return (
    <div 
      className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${
        isOverdue ? 'border-red-500' : 'border-primary-500'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">
          {order.orderNumber || order.id.slice(-6)}
        </span>
        {order.priority && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[order.priority] || 'bg-gray-100 text-gray-600'}`}>
            {order.priority}
          </span>
        )}
      </div>

      {/* Cliente */}
      <div className="flex items-center space-x-2 mb-2">
        <User className="w-3 h-3 text-gray-400" />
        <span className="text-sm font-medium text-gray-800 truncate">{order.clientName}</span>
      </div>

      {/* Artículo */}
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
        {order.itemType} · {order.material}
      </p>
      
      {/* Descripción corta */}
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {order.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className={`text-gray-600 ${daysSince > 3 ? 'text-orange-600 font-medium' : ''}`}>
            {daysSince}d
          </span>
        </div>
        
        {order.budget ? (
          <div className="flex items-center space-x-1">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600 font-medium">{order.budget}€</span>
          </div>
        ) : (
          <span className="text-amber-600 text-xs">Sin ppto</span>
        )}
        
        {order.photos?.length > 0 && (
          <div className="flex items-center space-x-1">
            <Camera className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">{order.photos.length}</span>
          </div>
        )}

        {isOverdue && (
          <AlertCircle className="w-3 h-3 text-red-500" title="Retrasado" />
        )}
      </div>

      {/* Status badge */}
      <div className="mt-2">
        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>
    </div>
  );
}

export default OrderCard;