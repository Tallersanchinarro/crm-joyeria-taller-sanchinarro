// import PhotoGallery from '../components/orders/PhotoGallery';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  Gem,
  Camera,
  FileText,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Package,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Send,
  Calendar,
  ChevronDown,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  Settings,
  Link as LinkIcon // AÑADIDO
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReceptionPDF } from '../utils/pdfGenerator';

function DetalleReparacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, clients, updateOrder, generateBudgetLink } = useApp(); // AÑADIDO generateBudgetLink
  
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [diagnosis, setDiagnosis] = useState({
    works: [],
    materials: [],
    observations: ''
  });
  const [newWork, setNewWork] = useState('');
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: 1, price: 0 });
  const [budget, setBudget] = useState({
    total: 0,
    labor: 0,
    materials: 0,
    discount: 0,
    notes: ''
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // NUEVOS ESTADOS PARA ENLACES
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [budgetLink, setBudgetLink] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  // Cargar datos
  useEffect(() => {
    if (orders.length > 0) {
      const foundOrder = orders.find(o => o.id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        const foundClient = clients.find(c => c.id === foundOrder.client_id);
        setClient(foundClient);
        
        // Cargar diagnóstico si existe
        if (foundOrder.diagnosis) {
          setDiagnosis(foundOrder.diagnosis);
        }
        
        // Cargar presupuesto si existe
        if (foundOrder.budget) {
          setBudget({
            total: foundOrder.budget,
            labor: foundOrder.budget_labor || 0,
            materials: foundOrder.budget_materials || 0,
            discount: foundOrder.budget_discount || 0,
            notes: foundOrder.budget_notes || ''
          });
        }
      }
      setLoading(false);
    }
  }, [id, orders, clients]);

  const getStatusColor = (status) => {
    const colors = {
      'Recibido': 'bg-purple-100 text-purple-700',
      'En análisis': 'bg-blue-100 text-blue-700',
      'Presupuestado': 'bg-yellow-100 text-yellow-700',
      'Aceptado': 'bg-green-100 text-green-700',
      'Rechazado': 'bg-red-100 text-red-700',
      'En reparación': 'bg-orange-100 text-orange-700',
      'Listo': 'bg-green-100 text-green-700',
      'Entregado': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Añadir trabajo necesario
  const addWork = () => {
    if (newWork.trim()) {
      setDiagnosis({
        ...diagnosis,
        works: [...diagnosis.works, { id: Date.now(), description: newWork, estimatedHours: 1 }]
      });
      setNewWork('');
    }
  };

  // Añadir material necesario
  const addMaterial = () => {
    if (newMaterial.name.trim() && newMaterial.price > 0) {
      setDiagnosis({
        ...diagnosis,
        materials: [...diagnosis.materials, { ...newMaterial, id: Date.now() }]
      });
      setNewMaterial({ name: '', quantity: 1, price: 0 });
    }
  };

  // Guardar diagnóstico
  const saveDiagnosis = () => {
    const now = new Date().toISOString();
    
    // Crear entrada en historial
    const historyEntry = {
      from: order.status,
      to: 'En análisis',
      date: now,
      note: 'Diagnóstico guardado'
    };
    
    const statusHistory = order.status_history || [];
    
    updateOrder(order.id, { 
      diagnosis: diagnosis,
      status: 'En análisis',
      diagnosis_date: now,
      status_history: [...statusHistory, historyEntry]
    });
    
    // Actualizar estado local
    setOrder({
      ...order,
      diagnosis: diagnosis,
      status: 'En análisis',
      diagnosis_date: now
    });
    
    setSuccessMessage('Diagnóstico guardado correctamente');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Calcular presupuesto
  const calculateBudget = () => {
    const materialsTotal = diagnosis.materials.reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const laborTotal = diagnosis.works.reduce((sum, w) => sum + (w.estimatedHours * 25), 0);
    const total = laborTotal + materialsTotal;
    
    setBudget({
      ...budget,
      labor: laborTotal,
      materials: materialsTotal,
      total: total
    });
  };

  // Guardar y enviar presupuesto
  const saveAndSendBudget = () => {
    const now = new Date().toISOString();
    
    // Crear entrada en historial
    const historyEntry = {
      from: order.status,
      to: 'Presupuestado',
      date: now,
      note: 'Presupuesto generado'
    };
    
    const statusHistory = order.status_history || [];
    
    updateOrder(order.id, {
      diagnosis: diagnosis,
      budget: budget.total,
      budget_labor: budget.labor,
      budget_materials: budget.materials,
      budget_discount: budget.discount,
      budget_notes: budget.notes,
      budget_status: 'pendiente',
      status: 'Presupuestado',
      budget_date: now,
      status_history: [...statusHistory, historyEntry]
    });
    
    // Actualizar estado local
    setOrder({
      ...order,
      diagnosis: diagnosis,
      budget: budget.total,
      budget_labor: budget.labor,
      budget_materials: budget.materials,
      budget_discount: budget.discount,
      budget_notes: budget.notes,
      budget_status: 'pendiente',
      status: 'Presupuestado',
      budget_date: now
    });
    
    setShowBudgetModal(false);
    setSuccessMessage('Presupuesto guardado. Se ha enviado al cliente.');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Cambiar estado según respuesta del cliente
  const handleClientResponse = (response) => {
    const now = new Date().toISOString();
    const newStatus = response === 'aceptado' ? 'Aceptado' : 'Rechazado';
    
    // Crear entrada en historial
    const historyEntry = {
      from: order.status,
      to: newStatus,
      date: now,
      note: `Cliente ${response === 'aceptado' ? 'acepta' : 'rechaza'} presupuesto`
    };
    
    const statusHistory = order.status_history || [];
    
    updateOrder(order.id, {
      status: newStatus,
      budget_status: response,
      response_date: now,
      status_history: [...statusHistory, historyEntry]
    });
    
    // Actualizar estado local
    setOrder({
      ...order,
      status: newStatus,
      budget_status: response
    });
    
    setSuccessMessage(`Cliente ha ${response === 'aceptado' ? 'ACEPTADO' : 'RECHAZADO'} el presupuesto`);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Iniciar reparación
  const startRepair = () => {
    const now = new Date().toISOString();
    
    // Crear entrada en historial
    const historyEntry = {
      from: order.status,
      to: 'En reparación',
      date: now,
      note: 'Inicio de reparación'
    };
    
    const statusHistory = order.status_history || [];
    
    updateOrder(order.id, { 
      status: 'En reparación', 
      start_date: now,
      status_history: [...statusHistory, historyEntry]
    });
    
    // Actualizar estado local
    setOrder({
      ...order,
      status: 'En reparación',
      start_date: now
    });
    
    setSuccessMessage('Reparación iniciada');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Marcar como listo
  const markAsReady = () => {
    const now = new Date().toISOString();
    
    // Crear entrada en historial
    const historyEntry = {
      from: order.status,
      to: 'Listo',
      date: now,
      note: 'Reparación finalizada'
    };
    
    const statusHistory = order.status_history || [];
    
    updateOrder(order.id, { 
      status: 'Listo', 
      completed_at: now,
      status_history: [...statusHistory, historyEntry]
    });
    
    // Actualizar estado local
    setOrder({
      ...order,
      status: 'Listo',
      completed_at: now
    });
    
    setSuccessMessage('Reparación lista para entregar');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Marcar como entregado
  const markAsDelivered = () => {
    const now = new Date().toISOString();
    
    // Crear entrada en historial
    const historyEntry = {
      from: order.status,
      to: 'Entregado',
      date: now,
      note: 'Entregado al cliente'
    };
    
    const statusHistory = order.status_history || [];
    
    updateOrder(order.id, { 
      status: 'Entregado', 
      delivered_at: now,
      paid: true,
      status_history: [...statusHistory, historyEntry]
    });
    
    // Actualizar estado local
    setOrder({
      ...order,
      status: 'Entregado',
      delivered_at: now,
      paid: true
    });
    
    setSuccessMessage('Reparación entregada al cliente');
    setShowSuccessMessage(true);
    setTimeout(() => {
      navigate('/reparaciones-activas');
    }, 2000);
  };

  // Generar PDF
  const generatePDF = (type) => {
    if (order && client) {
      const pdfType = type === 'budget' ? 'taller' : 'cliente';
      const orderForPDF = {
        ...order,
        order_number: order.order_number,
        item_type: order.item_type,
        client_name: client.name,
        client_phone: client.phone,
        created_at: order.created_at
      };
      generateReceptionPDF(orderForPDF, client, pdfType);
    }
  };

  // NUEVA FUNCIÓN: Generar enlace para el cliente
  const handleGenerateLink = async () => {
    try {
      const link = await generateBudgetLink(order.id);
      setBudgetLink(link);
      setShowLinkModal(true);
    } catch (error) {
      alert('Error al generar enlace: ' + error.message);
    }
  };

  // NUEVA FUNCIÓN: Copiar enlace al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard.writeText(budgetLink.url);
    setCopySuccess('¡Copiado!');
    setTimeout(() => setCopySuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order || !client) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Reparación no encontrada</h2>
        <button onClick={() => navigate('/reparaciones-activas')} className="mt-4 btn-primary">
          Volver a reparaciones
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header con navegación */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/reparaciones-activas')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  Reparación #{order.order_number}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Recibida: {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Acciones según estado - AÑADIDO BOTÓN ENLACE */}
          <div className="flex items-center space-x-2">
            {order.status === 'Recibido' && (
              <button
                onClick={() => updateOrder(order.id, { status: 'En análisis' })}
                className="btn-primary flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Iniciar análisis</span>
              </button>
            )}
            
            {order.status === 'Presupuestado' && (
              <>
                <button
                  onClick={() => handleClientResponse('aceptado')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Cliente acepta</span>
                </button>
                <button
                  onClick={() => handleClientResponse('rechazado')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Cliente rechaza</span>
                </button>
                {/* NUEVO BOTÓN DE ENLACE */}
                <button
                  onClick={handleGenerateLink}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Enlace</span>
                </button>
              </>
            )}

            {order.status === 'Aceptado' && (
              <button
                onClick={startRepair}
                className="btn-primary flex items-center space-x-2"
              >
                <Wrench className="w-4 h-4" />
                <span>Iniciar reparación</span>
              </button>
            )}

            {order.status === 'En reparación' && (
              <button
                onClick={markAsReady}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Marcar como listo</span>
              </button>
            )}

            {order.status === 'Listo' && (
              <button
                onClick={markAsDelivered}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Package className="w-4 h-4" />
                <span>Entregar al cliente</span>
              </button>
            )}

            <button
              onClick={() => generatePDF('budget')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'diagnosis'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Diagnóstico y Análisis
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'budget'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 Presupuesto
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'tracking'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Seguimiento
          </button>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{client.name}</h3>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {client.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 
  // FOTOS DE LA JOYA (DESACTIVADO - Supabase Storage)
  // Para activar: descomentar y importar PhotoGallery
  
  <div className="bg-white rounded-xl shadow-sm p-6">
    <PhotoGallery 
      orderId={order.id} 
      existingPhotos={order.photos || []} 
      onPhotosChange={(newPhotos) => {
        setOrder({...order, photos: newPhotos});
      }}
    />
  </div>
*/}


      {/* TAB 1: DIAGNÓSTICO */}
      {activeTab === 'diagnosis' && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Análisis del Joyero</h2>
            <button
              onClick={saveDiagnosis}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar diagnóstico</span>
            </button>
          </div>

          {/* Trabajos necesarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trabajos a realizar
            </label>
            <div className="space-y-2">
              {diagnosis.works.map((work) => (
                <div key={work.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-800">{work.description}</span>
                  <span className="text-xs text-gray-500">{work.estimatedHours}h estimadas</span>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newWork}
                  onChange={(e) => setNewWork(e.target.value)}
                  placeholder="Ej: Reengarzar piedra, Soldadura..."
                  className="flex-1 input-field text-sm"
                />
                <button
                  onClick={addWork}
                  className="btn-secondary px-3 py-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Materiales necesarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materiales necesarios
            </label>
            <div className="space-y-2">
              {diagnosis.materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-800">{material.name}</span>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-gray-500">Cant: {material.quantity}</span>
                    <span className="font-medium">{material.price}€</span>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                  placeholder="Material"
                  className="col-span-2 input-field text-sm"
                />
                <input
                  type="number"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({...newMaterial, quantity: parseInt(e.target.value)})}
                  min="1"
                  placeholder="Cant"
                  className="input-field text-sm"
                />
                <input
                  type="number"
                  value={newMaterial.price}
                  onChange={(e) => setNewMaterial({...newMaterial, price: parseFloat(e.target.value)})}
                  min="0"
                  step="0.01"
                  placeholder="€"
                  className="input-field text-sm"
                />
                <button
                  onClick={addMaterial}
                  className="btn-secondary col-span-4"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Añadir material
                </button>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={diagnosis.observations}
              onChange={(e) => setDiagnosis({...diagnosis, observations: e.target.value})}
              rows="3"
              className="input-field"
              placeholder="Notas internas..."
            />
          </div>

          {/* Botón presupuesto */}
          {(diagnosis.works.length > 0 || diagnosis.materials.length > 0) && (
            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  calculateBudget();
                  setShowBudgetModal(true);
                }}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>Generar presupuesto</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESUPUESTO */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Presupuesto</h2>

          {order.budget ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mano de obra:</span>
                    <span className="font-medium">{order.budget_labor || 0}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Materiales:</span>
                    <span className="font-medium">{order.budget_materials || 0}€</span>
                  </div>
                  {order.budget_discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span>-{order.budget_discount}€</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="text-primary-600">{order.budget}€</span>
                  </div>
                </div>
              </div>

              {order.budget_notes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">{order.budget_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.budget_status === 'aceptado' ? 'bg-green-100 text-green-700' :
                  order.budget_status === 'rechazado' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.budget_status === 'aceptado' ? '✓ Aceptado' :
                   order.budget_status === 'rechazado' ? '✗ Rechazado' :
                   '⏳ Pendiente'}
                </span>

                <button
                  onClick={() => generatePDF('budget')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aún no se ha generado presupuesto</p>
              <button
                onClick={() => setActiveTab('diagnosis')}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Ir a diagnóstico
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEGUIMIENTO */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Seguimiento</h2>

          {/* Timeline */}
          <div className="space-y-4">
            {/* Recibida */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Package className="w-3 h-3 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Recibida en taller</p>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Diagnóstico */}
            {order.diagnosis_date && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Settings className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Análisis realizado</p>
                  <p className="text-sm text-gray-500">{new Date(order.diagnosis_date).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Presupuesto */}
            {order.budget_date && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <DollarSign className="w-3 h-3 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Presupuesto generado</p>
                  <p className="text-sm text-gray-500">{new Date(order.budget_date).toLocaleString()}</p>
                  {order.budget_status && (
                    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                      order.budget_status === 'aceptado' ? 'bg-green-100 text-green-700' :
                      order.budget_status === 'rechazado' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.budget_status === 'aceptado' ? 'Aceptado' :
                       order.budget_status === 'rechazado' ? 'Rechazado' :
                       'Pendiente'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Inicio reparación */}
            {order.start_date && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Wrench className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Reparación iniciada</p>
                  <p className="text-sm text-gray-500">{new Date(order.start_date).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Completada */}
            {order.completed_at && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Reparación finalizada</p>
                  <p className="text-sm text-gray-500">{new Date(order.completed_at).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Entregada */}
            {order.delivered_at && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Package className="w-3 h-3 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Entregada al cliente</p>
                  <p className="text-sm text-gray-500">{new Date(order.delivered_at).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Historial adicional */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-gray-700 mb-3">Historial completo</h3>
                <div className="space-y-2">
                  {order.status_history.map((entry, idx) => (
                    <div key={idx} className="text-xs flex items-start space-x-2 bg-gray-50 p-2 rounded">
                      <span className="text-gray-400 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString()}:
                      </span>
                      <span>
                        {entry.from} → {entry.to}
                        {entry.note && <span className="text-gray-500 ml-1">({entry.note})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de presupuesto */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Generar presupuesto</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Resumen del diagnóstico:</p>
                <p className="text-xs text-gray-500 mt-1">
                  {diagnosis.works.length} trabajos · {diagnosis.materials.length} materiales
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mano de obra (€)
                  </label>
                  <input
                    type="number"
                    value={budget.labor}
                    className="input-field"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materiales (€)
                  </label>
                  <input
                    type="number"
                    value={budget.materials}
                    className="input-field"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento (€)
                  </label>
                  <input
                    type="number"
                    value={budget.discount}
                    onChange={(e) => setBudget({...budget, discount: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span className="text-primary-600">
                      {(budget.labor + budget.materials - budget.discount).toFixed(2)}€
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas para el cliente
                  </label>
                  <textarea
                    value={budget.notes}
                    onChange={(e) => setBudget({...budget, notes: e.target.value})}
                    rows="3"
                    className="input-field"
                    placeholder="Información adicional..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={saveAndSendBudget}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Guardar y enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO MODAL DE ENLACE */}
      {/* MODAL DE ENLACE MEJORADO */}
{showLinkModal && budgetLink && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-md w-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Compartir presupuesto</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Información del cliente */}
        {client && (
          <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">{client.name}</p>
              <p className="text-sm text-gray-500">{client.phone}</p>
            </div>
          </div>
        )}

        {/* Enlace generado */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">Enlace único (válido 7 días):</p>
          <div className="bg-white p-3 rounded border text-sm break-all font-mono">
            {budgetLink.url}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-3">
          {/* Botón copiar */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(budgetLink.url);
              setCopySuccess('¡Copiado!');
              setTimeout(() => setCopySuccess(''), 2000);
            }}
            className="flex items-center justify-center space-x-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>{copySuccess || 'Copiar'}</span>
          </button>

          {/* Botón WhatsApp (usa el número del cliente) */}
          <a
            href={`https://wa.me/${client?.phone?.replace(/\s+/g, '')}?text=${encodeURIComponent(
              `Hola ${client?.name}, aquí tienes el presupuesto para tu joya:\n\n` +
              `🔗 ${budgetLink.url}\n\n` +
              `Puedes aceptarlo o rechazarlo directamente desde el enlace.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Info adicional */}
        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
          <p>📱 El enlace se abrirá sin necesidad de login.</p>
          <p>⏳ Caduca el {new Date(budgetLink.expires_at).toLocaleDateString()}.</p>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 flex justify-end">
        <button
          onClick={() => {
            setShowLinkModal(false);
            setBudgetLink(null);
            setCopySuccess('');
          }}
          className="btn-primary"
        >
          Cerrar
        </button>
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
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default DetalleReparacion;