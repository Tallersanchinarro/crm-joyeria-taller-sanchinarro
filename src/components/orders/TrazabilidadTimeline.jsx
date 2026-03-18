import React from 'react';
import {
  Package,
  Settings,
  DollarSign,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';

function TrazabilidadTimeline({ orden }) {
  const eventos = [
    {
      estado: 'Recibido',
      fecha: orden.created_at,
      icon: Package,
      color: 'bg-purple-500',
      descripcion: 'Recepción en taller'
    },
    orden.diagnosis_date && {
      estado: 'En análisis',
      fecha: orden.diagnosis_date,
      icon: Settings,
      color: 'bg-blue-500',
      descripcion: 'Diagnóstico realizado'
    },
    orden.budget_date && {
      estado: 'Presupuestado',
      fecha: orden.budget_date,
      icon: DollarSign,
      color: 'bg-yellow-500',
      descripcion: 'Presupuesto generado',
      estadoCliente: orden.budget_status
    },
    orden.start_date && {
      estado: 'En reparación',
      fecha: orden.start_date,
      icon: Wrench,
      color: 'bg-orange-500',
      descripcion: 'Reparación iniciada'
    },
    orden.completed_at && {
      estado: 'Listo',
      fecha: orden.completed_at,
      icon: CheckCircle,
      color: 'bg-green-500',
      descripcion: 'Reparación finalizada'
    },
    orden.delivered_at && {
      estado: 'Entregado',
      fecha: orden.delivered_at,
      icon: Package,
      color: 'bg-gray-500',
      descripcion: 'Entregado al cliente'
    }
  ].filter(Boolean).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const getEstadoClienteBadge = (estado) => {
    switch(estado) {
      case 'aceptado': return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aceptado</span>;
      case 'rechazado': return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Rechazado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-4">Línea de tiempo de la reparación</h3>
      
      <div className="space-y-6">
        {eventos.map((evento, index) => {
          const Icon = evento.icon;
          const isLast = index === eventos.length - 1;
          
          return (
            <div key={index} className="relative flex items-start space-x-4">
              {/* Línea conectora */}
              {!isLast && (
                <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              )}
              
              {/* Icono */}
              <div className={`relative z-10 w-10 h-10 ${evento.color} rounded-full flex items-center justify-center text-white shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Contenido */}
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">{evento.estado}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(evento.fecha).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{evento.descripcion}</p>
                {evento.estadoCliente && (
                  <div className="mt-2">
                    {getEstadoClienteBadge(evento.estadoCliente)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial adicional de cambios de estado */}
      {orden.status_history && orden.status_history.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-primary-500" />
            Historial completo
          </h4>
          <div className="space-y-2">
            {orden.status_history.map((entry, idx) => (
              <div key={idx} className="text-xs flex items-start space-x-2 bg-gray-50 p-2 rounded">
                <span className="text-gray-400 whitespace-nowrap">
                  {new Date(entry.date).toLocaleString()}:
                </span>
                <span>
                  <span className="font-medium">{entry.from}</span> →{' '}
                  <span className="font-medium">{entry.to}</span>
                  {entry.note && (
                    <span className="text-gray-500 ml-2">({entry.note})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrazabilidadTimeline;