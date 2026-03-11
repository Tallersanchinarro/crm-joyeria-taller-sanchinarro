import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Gem,
  Camera,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Printer,
  FileText,
  Copy,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReceptionPDF } from '../utils/pdfGenerator';

const tiposJoya = [
  'Anillo', 'Collar', 'Pendientes', 'Pulsera', 'Reloj',
  'Medalla/Religiosa', 'Broche', 'Cadenas', 'Gargantilla',
  'Diadema', 'Juego completo', 'Otro'
];

const tiposMaterial = [
  'Oro amarillo 18k', 'Oro blanco 18k', 'Oro rosa 18k',
  'Oro 14k', 'Oro 9k', 'Oro 24k', 'Plata 925', 'Plata ley',
  'Acero inoxidable', 'Titanio', 'Bronce', 'Cobre', 'Latón',
  'Rodio', 'Paladio', 'Platino', 'Acero quirúrgico',
  'Madera', 'Resina', 'Cuero', 'Otro'
];

function NuevaRecepcion() {
  const navigate = useNavigate();
  const { clients, createClient, createOrder } = useApp();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [cliente, setCliente] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [recepcion, setRecepcion] = useState({
    itemType: '',
    material: '',
    description: '',
    observations: ''
  });
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nuevaOrden, setNuevaOrden] = useState(null);

  // Buscar clientes existentes
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  ).slice(0, 5);

  // Seleccionar cliente existente
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setCliente({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || ''
    });
    setShowClientSearch(false);
    setStep(2);
  };

  // Generar número de recepción
  const generarNumeroRecepcion = () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `R-${año}${mes}${dia}-${random}`;
  };

  // Guardar recepción
  const handleGuardarRecepcion = async () => {
    setLoading(true);
    setError(null);

    try {
      let clientId = selectedClient?.id;

      // Crear cliente si no existe
      if (!clientId) {
        const newClient = await createClient({
          name: cliente.name,
          phone: cliente.phone,
          email: cliente.email || null,
          address: cliente.address || null,
          notes: ''
        });
        clientId = newClient.id;
      }

      // Crear orden
      const orderNumber = generarNumeroRecepcion();
      const newOrder = await createOrder({
        order_number: orderNumber,
        client_id: clientId,
        client_name: cliente.name,
        client_phone: cliente.phone,
        client_email: cliente.email || null,
        item_type: recepcion.itemType,
        material: recepcion.material,
        description: recepcion.description,
        observations: recepcion.observations || null,
        status: 'Recibido',
        budget: null,
        budget_status: 'pendiente',
        photos: fotos,
        diagnosis: null,
        priority: 'Normal'
      });

      setNuevaOrden(newOrder);
      setStep(3);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintClientPDF = () => {
    if (nuevaOrden && (selectedClient || cliente)) {
      generateReceptionPDF(nuevaOrden, cliente, 'cliente');
    }
  };

  const handlePrintWorkshopPDF = () => {
    if (nuevaOrden && (selectedClient || cliente)) {
      generateReceptionPDF(nuevaOrden, cliente, 'taller');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nueva Recepción</h1>
            <p className="text-sm text-gray-500">Registrar entrada de joya para análisis</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 w-full h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {['Cliente', 'Joya', 'Resguardo'].map((label, idx) => (
            <div key={label} className={`text-center ${step >= idx + 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <span className="text-sm font-medium">{idx + 1}. {label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>✅ Recepción guardada</span>
          </div>
        </div>
      )}

      {/* PASO 1: Cliente */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary-500" />
            Datos del Cliente
          </h2>

          {/* Buscar cliente existente */}
          <div>
            <button
              onClick={() => setShowClientSearch(!showClientSearch)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
            >
              <Search className="w-4 h-4 mr-1" />
              {showClientSearch ? 'Ocultar búsqueda' : 'Buscar cliente existente'}
            </button>

            {showClientSearch && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field mb-2"
                />
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                      </div>
                      <span className="text-xs text-gray-400">{client.total_orders || 0} órdenes</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-4">O ingresa un cliente nuevo:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={cliente.name}
                  onChange={(e) => setCliente({...cliente, name: e.target.value})}
                  className="input-field"
                />
              </div>
              <input
                type="tel"
                placeholder="Teléfono *"
                value={cliente.phone}
                onChange={(e) => setCliente({...cliente, phone: e.target.value})}
                className="input-field"
              />
              <input
                type="email"
                placeholder="Email (opcional)"
                value={cliente.email}
                onChange={(e) => setCliente({...cliente, email: e.target.value})}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Dirección (opcional)"
                value={cliente.address}
                onChange={(e) => setCliente({...cliente, address: e.target.value})}
                className="input-field md:col-span-2"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!cliente.name || !cliente.phone}
              className="btn-primary px-6"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Joya */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Gem className="w-5 h-5 mr-2 text-primary-500" />
            Datos de la Joya
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <select
              value={recepcion.itemType}
              onChange={(e) => setRecepcion({...recepcion, itemType: e.target.value})}
              className="input-field"
            >
              <option value="">Tipo de joya *</option>
              {tiposJoya.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            <select
              value={recepcion.material}
              onChange={(e) => setRecepcion({...recepcion, material: e.target.value})}
              className="input-field"
            >
              <option value="">Material *</option>
              {tiposMaterial.map(material => (
                <option key={material} value={material}>{material}</option>
              ))}
            </select>

            <textarea
              value={recepcion.description}
              onChange={(e) => setRecepcion({...recepcion, description: e.target.value})}
              rows="4"
              className="input-field"
              placeholder="Descripción del problema *"
            />

            <textarea
              value={recepcion.observations}
              onChange={(e) => setRecepcion({...recepcion, observations: e.target.value})}
              rows="2"
              className="input-field"
              placeholder="Observaciones (opcional)"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              La joya queda registrada para análisis. El presupuesto se generará después.
            </p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Atrás
            </button>
            <button
              onClick={handleGuardarRecepcion}
              disabled={!recepcion.itemType || !recepcion.material || !recepcion.description || loading}
              className="btn-primary px-6 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar recepción</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Resguardo */}
      {step === 3 && nuevaOrden && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">¡Recepción completada!</h2>
            <p className="text-gray-500">Nº de orden: {nuevaOrden.order_number}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Cliente:</span> {cliente.name}</p>
              <p><span className="text-gray-500">Teléfono:</span> {cliente.phone}</p>
              <p><span className="text-gray-500">Joya:</span> {recepcion.itemType} · {recepcion.material}</p>
              <p><span className="text-gray-500">Problema:</span> {recepcion.description}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePrintClientPDF}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimir resguardo cliente</span>
            </button>

            <button
              onClick={handlePrintWorkshopPDF}
              className="w-full btn-secondary flex items-center justify-center space-x-2 py-3"
            >
              <Copy className="w-5 h-5" />
              <span>Imprimir copia taller</span>
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => {
                setStep(1);
                setSelectedClient(null);
                setCliente({ name: '', phone: '', email: '', address: '' });
                setRecepcion({ itemType: '', material: '', description: '', observations: '' });
                setNuevaOrden(null);
              }}
              className="btn-secondary"
            >
              Nueva recepción
            </button>
            <button
              onClick={() => navigate('/reparaciones-activas')}
              className="btn-primary"
            >
              Ver reparaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NuevaRecepcion;