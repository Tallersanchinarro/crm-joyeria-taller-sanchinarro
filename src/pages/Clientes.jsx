import React, { useState, useMemo, useCallback } from 'react';
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
  AlertCircle,
  CheckCircle,
  Eye,
  MoreVertical,
  Download,
  Filter,
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';

function Clientes() {
  const navigate = useNavigate();
  const { clients, orders, createClient, updateClient, deleteClient } = useApp();
  const { showNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterActive, setFilterActive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  // Obtener órdenes de un cliente
  const getClientOrders = useCallback((clientId) => {
    return orders.filter(o => o.client_id === clientId);
  }, [orders]);

  // Obtener órdenes activas
  const getActiveOrders = useCallback((clientId) => {
    return orders.filter(o => 
      o.client_id === clientId && 
      o.status !== 'Entregado' && 
      o.status !== 'Rechazado'
    ).length;
  }, [orders]);

  // Obtener última orden
  const getLastOrderDate = useCallback((clientId) => {
    const clientOrders = orders.filter(o => o.client_id === clientId);
    if (clientOrders.length === 0) return null;
    const lastOrder = clientOrders.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];
    return lastOrder.created_at;
  }, [orders]);

  // Filtrar y ordenar clientes
  const filteredClients = useMemo(() => {
    let result = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.nif && client.nif.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filterActive) {
      result = result.filter(client => getActiveOrders(client.id) > 0);
    }

    result.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'nif':
          aValue = a.nif?.toLowerCase() || '';
          bValue = b.nif?.toLowerCase() || '';
          break;
        case 'date':
          aValue = new Date(getLastOrderDate(a.id) || 0).getTime();
          bValue = new Date(getLastOrderDate(b.id) || 0).getTime();
          break;
        case 'orders':
          aValue = getClientOrders(a.id).length;
          bValue = getClientOrders(b.id).length;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      else return aValue < bValue ? 1 : -1;
    });

    return result;
  }, [clients, searchTerm, filterActive, sortBy, sortOrder, getActiveOrders, getClientOrders, getLastOrderDate]);

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
        showNotification('Cliente actualizado correctamente', 'success');
      } else {
        await createClient(formData);
        showNotification('Cliente creado correctamente', 'success');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      setError(error.message);
      showNotification('Error al guardar el cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cliente
  const handleDeleteClient = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    const clientOrders = getClientOrders(id);

    if (clientOrders.length > 0) {
      showNotification('No se puede eliminar un cliente con órdenes asociadas', 'warning');
      setDeleteConfirm(null);
      return;
    }

    setLoading(true);
    try {
      await deleteClient(id);
      showNotification(`Cliente ${name} eliminado`, 'success');
      setDeleteConfirm(null);
    } catch (error) {
      showNotification('Error al eliminar: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para editar
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      nif: client.nif || '',
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
    setFormData({ name: '', nif: '', phone: '', email: '', address: '', notes: '' });
    setSelectedClient(null);
    setError(null);
  };

  // Ver detalles del cliente
  const handleViewClient = (client) => {
    navigate(`/reparaciones-activas?cliente=${client.id}`);
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title={viewMode === 'table' ? 'Vista de tarjetas' : 'Vista de tabla'}
          >
            {viewMode === 'table' ? '📇' : '📋'}
          </button>
          <button
            onClick={handleNewClient}
            className="btn-primary flex items-center space-x-2"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo cliente</span>
          </button>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIF, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterActive(!filterActive)}
              className={`px-3 py-2 border rounded-lg flex items-center space-x-2 ${
                filterActive ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Con órdenes activas</span>
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="nif">Ordenar por NIF</option>
              <option value="date">Ordenar por última actividad</option>
              <option value="orders">Ordenar por nº de órdenes</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay clientes que coincidan con la búsqueda</p>
            <button
              onClick={handleNewClient}
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + Añadir nuevo cliente
            </button>
          </div>
        ) : viewMode === 'table' ? (
          // Vista de tabla
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIF/CIF</th>
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.nif || '-'}
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
                            onClick={() => handleViewClient(client)}
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
                            onClick={() => setDeleteConfirm({ id: client.id, name: client.name })}
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
        ) : (
          // Vista de tarjetas
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredClients.map((client) => {
              const clientOrders = getClientOrders(client.id);
              const activeOrders = getActiveOrders(client.id);
              const lastOrderDate = getLastOrderDate(client.id);
              return (
                <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Gem className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        {client.nif && <p className="text-xs text-gray-500">NIF: {client.nif}</p>}
                      </div>
                    </div>
                    {activeOrders > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {activeOrders} activas
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center mb-1">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {client.phone}
                  </p>
                  {client.email && (
                    <p className="text-sm text-gray-600 flex items-center mb-2">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {client.email}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>Órdenes: {clientOrders.length}</span>
                    <span>Última: {lastOrderDate ? new Date(lastOrderDate).toLocaleDateString() : 'Nunca'}</span>
                  </div>
                  <div className="flex justify-end space-x-2 border-t pt-3">
                    <button
                      onClick={() => handleViewClient(client)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Ver reparaciones"
                    >
                      <Package className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: client.id, name: client.name })}
                      className="p-2 hover:bg-red-100 rounded"
                      title="Eliminar"
                      disabled={clientOrders.length > 0}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar a <span className="font-bold">{deleteConfirm.name}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteClient}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">
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
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: María García"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIF / CIF
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.nif}
                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="12345678A / B12345678"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Obligatorio para emitir facturas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+34 612 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Calle, ciudad..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClient}
                disabled={loading || !formData.name || !formData.phone}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Actualizar' : 'Crear'}</span>
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