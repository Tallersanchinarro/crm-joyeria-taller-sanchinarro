import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  Clock,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Gem,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function Clientes() {
  const navigate = useNavigate();
  const { clients, orders, createClient, updateClient, deleteClient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  // Filtrar clientes
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener órdenes de un cliente
  const getClientOrders = (clientId) => {
    return orders.filter(o => o.client_id === clientId);
  };

  // Obtener órdenes activas
  const getActiveOrders = (clientId) => {
    return orders.filter(o => 
      o.client_id === clientId && 
      o.status !== 'Entregado' && 
      o.status !== 'Rechazado'
    ).length;
  };

  // Obtener última orden
  const getLastOrderDate = (clientId) => {
    const clientOrders = orders.filter(o => o.client_id === clientId);
    if (clientOrders.length === 0) return null;
    
    const lastOrder = clientOrders.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];
    
    return lastOrder.created_at;
  };

  // Guardar cliente
  const handleSaveClient = async () => {
    if (!formData.name || !formData.phone) {
      setError('Nombre y teléfono son obligatorios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && selectedClient) {
        await updateClient(selectedClient.id, formData);
      } else {
        await createClient(formData);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cliente
  const handleDeleteClient = async (client) => {
    const clientOrders = getClientOrders(client.id);
    
    if (clientOrders.length > 0) {
      alert('No se puede eliminar un cliente con órdenes asociadas');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar a ${client.name}?`)) {
      setLoading(true);
      try {
        await deleteClient(client.id);
      } catch (error) {
        alert('Error al eliminar: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Abrir modal para editar
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Abrir modal para nuevo
  const handleNewClient = () => {
    resetForm();
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    setSelectedClient(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-500">
            Total: {clients.length} clientes registrados
          </p>
        </div>
        <button
          onClick={handleNewClient}
          className="btn-primary flex items-center space-x-2"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay clientes</p>
            <button
              onClick={handleNewClient}
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Añadir primer cliente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Órdenes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última actividad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => {
                  const clientOrders = getClientOrders(client.id);
                  const activeOrders = getActiveOrders(client.id);
                  const lastOrderDate = getLastOrderDate(client.id);
                  
                  return (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Gem className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            {client.notes && (
                              <p className="text-xs text-gray-500 line-clamp-1">{client.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {client.phone}
                          </p>
                          {client.email && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {client.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            {clientOrders.length}
                          </span>
                          {activeOrders > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {activeOrders} activas
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {lastOrderDate ? new Date(lastOrderDate).toLocaleDateString() : 'Sin actividad'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/reparaciones-activas?cliente=${client.id}`)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Ver reparaciones"
                          >
                            <Package className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Editar"
                            disabled={loading}
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Eliminar"
                            disabled={loading || clientOrders.length > 0}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">
                {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  placeholder="Ej: María García"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input-field"
                  placeholder="+34 612 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección (opcional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input-field"
                  placeholder="Calle, ciudad..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  className="input-field"
                  placeholder="Información adicional..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClient}
                disabled={loading || !formData.name || !formData.phone}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Guardar' : 'Crear'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;