import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Gem,
  DollarSign,
  Calendar,
  Printer,
  Edit,
  XCircle,
  ChevronDown,
  ArrowRight,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReceptionPDF } from '../utils/pdfGenerator';

function ReparacionesActivas() {
  const navigate = useNavigate();
  const { orders, clients, updateOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtrar órdenes activas (no entregadas/archivadas)
  const activeOrders = orders.filter(o => 
    o.status !== 'Entregado' && 
    o.status !== 'Archivado'
  );
  
  // Aplicar filtros de búsqueda y estado
  const filteredOrders = activeOrders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_phone?.includes(searchTerm) ||
      order.material?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'todas' || order.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Ordenar por fecha (más recientes primero)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const getStatusColor = (status) => {
    const colors = {
      'Recibido': 'bg-purple-100 text-purple-700 border-purple-200',
      'En análisis': 'bg-blue-100 text-blue-700 border-blue-200',
      'Presupuestado': 'bg-amber-100 text-amber-700 border-amber-200',
      'Aceptado': 'bg-green-100 text-green-700 border-green-200',
      'En reparación': 'bg-orange-100 text-orange-700 border-orange-200',
      'Listo': 'bg-green-100 text-green-700 border-green-200',
      'Rechazado': 'bg-gray-100 text-gray-700 border-gray-200',
      'Entregado': 'bg-gray-100 text-gray-700 border-gray-200',
      'Archivado': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Baja': 'text-green-600',
      'Normal': 'text-blue-600',
      'Alta': 'text-orange-600',
      'Urgente': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  // Abrir modal de cambio de estado
  const openStatusModal = (order, status) => {
    setSelectedOrder(order);
    setNewStatus(status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  // Confirmar cambio de estado
  const confirmStatusChange = () => {
    if (!selectedOrder) return;

    const updates = {
      status: newStatus,
      status_history: [
        ...(selectedOrder.status_history || []),
        {
          from: selectedOrder.status,
          to: newStatus,
          date: new Date().toISOString(),
          note: statusNote
        }
      ]
    };

    // Si el estado es "Listo", registrar fecha de finalización
    if (newStatus === 'Listo') {
      updates.completed_at = new Date().toISOString();
    }

    // Si el estado es "Rechazado" o "Archivado", registrar fecha
    if (newStatus === 'Rechazado' || newStatus === 'Archivado') {
      updates.archived_at = new Date().toISOString();
    }

    // Actualizar la orden
    updateOrder(selectedOrder.id, updates);

    // Mostrar mensaje de éxito
    setSuccessMessage(`Estado cambiado a: ${newStatus}`);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // Cerrar modal
    setShowStatusModal(false);
    setSelectedOrder(null);
    setNewStatus('');
    setStatusNote('');
  };

  // Marcar como listo
  const handleMarkAsReady = (order) => {
    setSelectedOrder(order);
    setNewStatus('Listo');
    setStatusNote('');
    setShowStatusModal(true);
  };

  // Marcar como rechazado
  const handleMarkAsRejected = (order) => {
    setSelectedOrder(order);
    setNewStatus('Rechazado');
    setStatusNote('Cliente rechaza presupuesto');
    setShowStatusModal(true);
  };

  // Manejar entrega (con redirección)
  const handleDelivered = () => {
    if (!selectedOrder) return;

    const updates = {
      status: 'Entregado',
      delivered_at: new Date().toISOString(),
      paid: true,
      status_history: [
        ...(selectedOrder.status_history || []),
        {
          from: selectedOrder.status,
          to: 'Entregado',
          date: new Date().toISOString(),
          note: statusNote || 'Entregado al cliente'
        }
      ]
    };

    updateOrder(selectedOrder.id, updates);

    // Mostrar mensaje
    setSuccessMessage('✅ Reparación entregada');
    setShowSuccessMessage(true);

    // Cerrar modal
    setShowStatusModal(false);

    // Redirigir al historial después de 1.5 segundos
    setTimeout(() => {
      navigate('/historial');
    }, 1500);
  };

  const handlePrintReceipt = (order) => {
    // Buscar el cliente completo para tener todos sus datos
    const client = clients.find(c => c.id === order.client_id);
    if (client) {
      generateReceptionPDF(order, client, 'cliente');
    } else {
      // Si no encontramos el cliente, usamos los datos de la orden
      const clientData = {
        name: order.client_name,
        phone: order.client_phone,
        email: order.client_email
      };
      generateReceptionPDF(order, clientData, 'cliente');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de éxito flotante */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reparaciones Activas</h1>
          <p className="text-sm text-gray-500">
            {activeOrders.length} reparaciones en curso
          </p>
        </div>
        <button
          onClick={() => navigate('/nueva-recepcion')}
          className="btn-primary flex items-center space-x-2"
        >
          <Package className="w-4 h-4" />
          <span>Nueva recepción</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por orden, cliente, joya o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="sm:w-48 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
            >
              <option value="todas">Todos los estados</option>
              <option value="Recibido">📦 Recibido</option>
              <option value="En análisis">🔍 En análisis</option>
              <option value="Presupuestado">💰 Presupuestado</option>
              <option value="Aceptado">✅ Aceptado</option>
              <option value="En reparación">🔧 En reparación</option>
              <option value="Listo">⏰ Listo</option>
              <option value="Rechazado">❌ Rechazado</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Lista de reparaciones */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presupuesto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay reparaciones activas</p>
                    <button
                      onClick={() => navigate('/nueva-recepcion')}
                      className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      + Registrar primera recepción
                    </button>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const isOverdue = order.estimated_date && new Date(order.estimated_date) < new Date() && order.status !== 'Listo' && order.status !== 'Entregado';
                  const isReady = order.status === 'Listo';
                  const isRejected = order.status === 'Rechazado';
                  
                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isOverdue ? 'bg-red-50' : isReady ? 'bg-green-50' : isRejected ? 'bg-gray-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`font-mono text-sm font-medium ${isRejected ? 'text-gray-500' : 'text-gray-900'}`}>
                            {order.order_number || order.id.slice(-6)}
                          </span>
                          {isOverdue && (
                            <AlertCircle className="w-4 h-4 text-red-500 ml-2" title="Retrasado" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 ${isRejected ? 'bg-gray-200' : 'bg-primary-100'} rounded-full flex items-center justify-center`}>
                            <User className={`h-4 w-4 ${isRejected ? 'text-gray-500' : 'text-primary-600'}`} />
                          </div>
                          <div className="ml-3">
                            <p className={`text-sm font-medium ${isRejected ? 'text-gray-500' : 'text-gray-900'}`}>
                              {order.client_name}
                            </p>
                            <p className={`text-xs flex items-center ${isRejected ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Phone className="w-3 h-3 mr-1" />
                              {order.client_phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className={`text-sm font-medium ${isRejected ? 'text-gray-500' : 'text-gray-900'}`}>
                            {order.item_type || 'Joya'}
                          </p>
                          <p className={`text-xs line-clamp-1 ${isRejected ? 'text-gray-400' : 'text-gray-500'}`}>
                            {order.material} · {order.description?.substring(0, 30)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!isRejected ? (
                          <button
                            onClick={() => openStatusModal(order, order.status)}
                            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)} hover:opacity-80 transition-opacity flex items-center space-x-1`}
                          >
                            <span>{order.status}</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.budget ? (
                          <>
                            <p className={`text-sm font-bold ${isRejected ? 'text-gray-500' : 'text-gray-900'}`}>{order.budget}€</p>
                            {order.budget_status === 'pendiente' && (
                              <p className="text-xs text-amber-600">Pendiente</p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">Sin presupuesto</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-xs ${isRejected ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Entrada: {new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Imprimir comprobante"
                          >
                            <Printer className="w-4 h-4 text-gray-600" />
                          </button>
                          
                          <button
                            onClick={() => navigate(`/reparacion/${order.id}`)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          
                          {isReady && (
                            <button
                              onClick={() => handleMarkAsReady(order)}
                              className="p-1 hover:bg-green-100 rounded-lg transition-colors"
                              title="Marcar como listo"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          )}

                          {order.budget_status === 'pendiente' && order.budget && (
                            <button
                              onClick={() => handleMarkAsRejected(order)}
                              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                              title="Rechazar presupuesto"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de cambio de estado */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center">
                <ArrowRight className="w-5 h-5 mr-2 text-primary-500" />
                Cambiar estado de reparación
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Información de la orden */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-800">{selectedOrder.client_name}</p>
                <p className="text-xs text-gray-600">{selectedOrder.item_type} · {selectedOrder.material}</p>
                <p className="text-xs text-gray-500 mt-1">Orden: {selectedOrder.order_number}</p>
              </div>

              {/* Selector de estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado actual: <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo estado *
                </label>
                <select
                  value={newStatus || selectedOrder.status}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field"
                  autoFocus
                >
                  <option value="Recibido">📦 Recibido</option>
                  <option value="En análisis">🔍 En análisis</option>
                  <option value="Presupuestado">💰 Presupuestado</option>
                  <option value="Aceptado">✅ Aceptado</option>
                  <option value="En reparación">🔧 En reparación</option>
                  <option value="Listo">⏰ Listo</option>
                  <option value="Rechazado" className="text-red-600">❌ Rechazado</option>
                  <option value="Entregado" className="text-green-600">🏁 Entregado</option>
                </select>
              </div>

              {/* Nota opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota / Comentario (opcional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows="3"
                  className="input-field"
                  placeholder="Añadir observación sobre este cambio..."
                />
              </div>

              {/* Advertencia según estado */}
              {newStatus === 'Rechazado' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Rechazar presupuesto</p>
                    <p className="text-xs text-red-700">
                      Al rechazar, la reparación se archivará y no pasará a taller.
                    </p>
                  </div>
                </div>
              )}

              {newStatus === 'Entregado' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Confirmar entrega</p>
                    <p className="text-xs text-green-700">
                      La reparación pasará al historial como completada.
                    </p>
                  </div>
                </div>
              )}

              {/* Historial de cambios */}
              {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Últimos cambios:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedOrder.status_history.slice(-3).map((change, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        <span className="text-gray-400">{new Date(change.date).toLocaleDateString()}:</span>
                        {change.from} → {change.to}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                  setNewStatus('');
                  setStatusNote('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              
              {newStatus === 'Entregado' ? (
                <button
                  onClick={handleDelivered}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar entrega</span>
                </button>
              ) : (
                <button
                  onClick={confirmStatusChange}
                  disabled={!newStatus || newStatus === selectedOrder.status}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar cambio
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ReparacionesActivas;