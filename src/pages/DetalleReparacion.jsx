import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
  Wrench,
  Link as LinkIcon,
  Edit,
  BarChart,
  MessageCircle,
  FileText,
  Percent,
  Layers,
  Package,
  AlertTriangle,
  X,
  Copy,
  Send,
  Share2,
  Tag,
  Euro,
  FileDown,
  Paperclip
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReceptionPDF } from '../utils/pdfGenerator';
import TrabajosPorFamilia from '../components/orders/TrabajosPorFamilia';
import FallosPorFamilia from '../components/orders/FallosPorFamilia';
import TrazabilidadTimeline from '../components/orders/TrazabilidadTimeline';
import { supabase } from '../lib/supabaseClient';

function DetalleReparacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, clients, updateOrder, generateBudgetLink } = useApp();
  
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trabajos');
  
  // Estados para trabajos y fallos seleccionados
  const [trabajosSeleccionados, setTrabajosSeleccionados] = useState([]);
  const [fallosSeleccionados, setFallosSeleccionados] = useState([]);
  
  // Estado para familias de trabajos (dinámico)
  const [familiasTrabajos, setFamiliasTrabajos] = useState([]);
  
  // Estados para diagnóstico
  const [diagnosis, setDiagnosis] = useState({
    observaciones: '',
    recomendaciones: '',
    tiempo_estimado: '',
    urgencia: 'normal'
  });
  
  // Estados para UI
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetDiscount, setBudgetDiscount] = useState(0);
  const [budgetDiscountType, setBudgetDiscountType] = useState('porcentaje');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [budgetLink, setBudgetLink] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  // Pestañas principales
  const tabs = [
    { id: 'editar', label: 'EDITAR', icon: Edit },
    { id: 'fallos', label: 'FALLOS', icon: AlertTriangle },
    { id: 'trabajos', label: 'TRABAJOS', icon: Wrench },
    { id: 'productos', label: 'PRODUCTOS', icon: Package },
    { id: 'archivos', label: 'ARCHIVOS', icon: FileText },
    { id: 'trazabilidad', label: 'TRAZABILIDAD', icon: BarChart },
    { id: 'conversacion', label: 'CONVERSACIÓN', icon: MessageCircle }
  ];

  // Cargar familias de trabajos desde Supabase
  useEffect(() => {
    const cargarFamilias = async () => {
      const { data } = await supabase
        .from('familias_trabajos')
        .select('*')
        .order('orden');
      setFamiliasTrabajos(data || []);
    };
    cargarFamilias();
  }, []);

  // Cargar orden y cliente
  useEffect(() => {
    if (orders.length > 0) {
      const foundOrder = orders.find(o => o.id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        const foundClient = clients.find(c => c.id === foundOrder.client_id);
        setClient(foundClient);
        
        if (foundOrder.trabajos) setTrabajosSeleccionados(foundOrder.trabajos);
        if (foundOrder.fallos) setFallosSeleccionados(foundOrder.fallos);
        if (foundOrder.diagnosis) setDiagnosis(foundOrder.diagnosis);
      }
      setLoading(false);
    }
  }, [id, orders, clients]);

  // Calcular contadores por familia (dinámico)
  const contadoresPorFamilia = React.useMemo(() => {
    const contadores = {};
    trabajosSeleccionados.forEach(t => {
      const familiaId = t.familia_id;
      contadores[familiaId] = (contadores[familiaId] || 0) + 1;
    });
    return contadores;
  }, [trabajosSeleccionados]);

  const getStatusColor = (status) => {
    const colors = {
      'Recibido': 'bg-purple-100 text-purple-700 border-purple-200',
      'En análisis': 'bg-blue-100 text-blue-700 border-blue-200',
      'Presupuestado': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Aceptado': 'bg-green-100 text-green-700 border-green-200',
      'Rechazado': 'bg-red-100 text-red-700 border-red-200',
      'En reparación': 'bg-orange-100 text-orange-700 border-orange-200',
      'Listo': 'bg-green-100 text-green-700 border-green-200',
      'Entregado': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const guardarDiagnostico = async () => {
    await updateOrder(order.id, { 
      diagnosis,
      trabajos: trabajosSeleccionados,
      fallos: fallosSeleccionados,
      status: 'En análisis'
    });
    
    setSuccessMessage('Diagnóstico guardado correctamente');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Calcular totales en tiempo real
  const calcularTotales = () => {
    const trabajosTotal = trabajosSeleccionados.reduce((sum, t) => {
      return sum + (t.total || t.tarifa_aplicada * (t.cantidad || 1) || 0);
    }, 0);
    
    const fallosTotal = fallosSeleccionados.reduce((sum, f) => sum + (f.total || 0), 0);
    const subtotal = trabajosTotal + fallosTotal;
    
    let descuentoAplicado = 0;
    if (budgetDiscount > 0) {
      if (budgetDiscountType === 'porcentaje') {
        descuentoAplicado = subtotal * (budgetDiscount / 100);
      } else {
        descuentoAplicado = Math.min(budgetDiscount, subtotal);
      }
    }
    
    return {
      trabajos: trabajosTotal,
      fallos: fallosTotal,
      subtotal,
      descuento: descuentoAplicado,
      total: subtotal - descuentoAplicado
    };
  };

  const totales = calcularTotales();

  const guardarPresupuesto = async () => {
    try {
      console.log('💾 Guardando presupuesto:', {
        trabajos: trabajosSeleccionados,
        fallos: fallosSeleccionados,
        total: totales.total
      });
      
      // Actualizar la orden
      await updateOrder(order.id, {
        trabajos: trabajosSeleccionados,
        fallos: fallosSeleccionados,
        budget: totales.total,
        budget_discount: totales.descuento,
        budget_notes: budgetNotes,
        budget_status: 'pendiente',
        status: 'Presupuestado',
        budget_date: new Date().toISOString()
      });
      
      // Cerrar modal de presupuesto
      setShowBudgetModal(false);
      
      // Mostrar mensaje de éxito
      setSuccessMessage('✅ Presupuesto generado correctamente');
      setShowSuccessMessage(true);
      
      // Generar enlace automáticamente
      setTimeout(async () => {
        try {
          const link = await generateBudgetLink(order.id);
          setBudgetLink(link);
          setShowLinkModal(true);
          setShowSuccessMessage(false);
        } catch (error) {
          console.error('Error generando enlace:', error);
          alert('Presupuesto guardado pero error al generar enlace: ' + error.message);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error guardando presupuesto:', error);
      alert('Error al guardar el presupuesto: ' + error.message);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const link = await generateBudgetLink(order.id);
      setBudgetLink(link);
      setShowLinkModal(true);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const generatePDF = (type) => {
    if (order && client) {
      generateReceptionPDF(order, client, type);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reparación...</p>
        </div>
      </div>
    );
  }

  if (!order || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reparación no encontrada</h2>
          <p className="text-gray-500 mb-6">La reparación que buscas no existe o ha sido eliminada.</p>
          <button onClick={() => navigate('/reparaciones-activas')} className="btn-primary">
            Volver a reparaciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Mensaje de éxito flotante */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header superior */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto">
          {/* Primera línea: Estado y navegación */}
          <div className="px-6 py-3 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/reparaciones-activas')}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">Home / Reparaciones /</span>
                <span className="font-bold text-white bg-gray-700 px-3 py-1 rounded-lg">
                  REPARACIÓN - {order.order_number}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-500/30">
                ⚡ ENVIADO. PENDIENTE DE CONTESTAR
              </span>
            </div>
          </div>

          {/* Segunda línea: Mensaje de actualización */}
          <div className="px-6 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
            <div className="flex items-center text-sm text-yellow-300">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <p>
                Si quiere actualizar esta reparación, debe ir al último presupuesto asociado y rechazarlo.
              </p>
            </div>
          </div>

          {/* Tercera línea: Info rápida */}
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cliente</p>
                  <p className="font-medium">{client.name}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-700"></div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-300">
                  <Phone className="w-4 h-4 mr-1 text-gray-400" />
                  {client.phone}
                </div>
                {client.email && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Mail className="w-4 h-4 mr-1 text-gray-400" />
                    {client.email}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <span className="text-sm text-gray-400">
                <Clock className="w-4 h-4 inline mr-1" />
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Pestañas principales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 bg-gray-50/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all
                    ${isActive 
                      ? 'border-b-2 border-primary-500 text-primary-600 bg-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500' : 'text-gray-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* PESTAÑA TRABAJOS */}
            {activeTab === 'trabajos' && (
              <div className="space-y-6">
                {/* Leyenda de familias */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-gray-500" />
                      Familias de trabajos
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {familiasTrabajos.map((familia) => (
                      <div
                        key={familia.id}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-lg text-sm border
                          ${contadoresPorFamilia[familia.id] > 0 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                          }
                        `}
                      >
                        <span className="text-gray-700">{familia.nombre}</span>
                        {contadoresPorFamilia[familia.id] > 0 ? (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-500 text-white">
                            {contadoresPorFamilia[familia.id]}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                            0
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <TrabajosPorFamilia 
                  ordenId={order.id}
                  onTrabajosChange={setTrabajosSeleccionados}
                  trabajosIniciales={trabajosSeleccionados}
                />
                
                {/* Botones de acción */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={guardarDiagnostico}
                    className="px-6 py-2.5 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 flex items-center space-x-2 transition-colors font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar diagnóstico</span>
                  </button>
                  
                  {(trabajosSeleccionados.length > 0 || fallosSeleccionados.length > 0) && (
                    <button
                      onClick={() => setShowBudgetModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Generar presupuesto</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA FALLOS */}
            {activeTab === 'fallos' && (
              <div className="space-y-6">
                <FallosPorFamilia 
                  ordenId={order.id}
                  onFallosChange={setFallosSeleccionados}
                  fallosIniciales={fallosSeleccionados}
                />
                
                <div className="flex justify-end">
                  <button
                    onClick={guardarDiagnostico}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar fallos</span>
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA EDITAR */}
            {activeTab === 'editar' && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                  <textarea
                    value={diagnosis.observaciones}
                    onChange={(e) => setDiagnosis({...diagnosis, observaciones: e.target.value})}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Añade observaciones sobre la reparación..."
                  />
                </div>
                <div className="flex justify-end">
                  <button onClick={guardarDiagnostico} className="btn-primary">
                    Guardar cambios
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA TRAZABILIDAD */}
            {activeTab === 'trazabilidad' && (
              <TrazabilidadTimeline orden={order} />
            )}

            {/* Otras pestañas */}
            {activeTab === 'productos' && (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Módulo de productos</p>
                <p className="text-sm text-gray-400">Próximamente</p>
              </div>
            )}

            {activeTab === 'archivos' && (
              <div className="text-center py-16">
                <Paperclip className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Archivos adjuntos</p>
                <p className="text-sm text-gray-400">Próximamente</p>
              </div>
            )}

            {activeTab === 'conversacion' && (
              <div className="text-center py-16">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Historial de conversación</p>
                <p className="text-sm text-gray-400">Próximamente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE PRESUPUESTO */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Generar presupuesto</h3>
              <button onClick={() => setShowBudgetModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Resumen de totales */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total trabajos:</span>
                    <span className="font-medium">{totales.trabajos.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total fallos:</span>
                    <span className="font-medium">{totales.fallos.toFixed(2)}€</span>
                  </div>
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Subtotal:</span>
                      <span className="text-gray-800">{totales.subtotal.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de tipo de descuento */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setBudgetDiscountType('porcentaje')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium ${
                    budgetDiscountType === 'porcentaje'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Percent className="w-4 h-4 inline mr-1" /> %
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetDiscountType('euros')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium ${
                    budgetDiscountType === 'euros'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Euro className="w-4 h-4 inline mr-1" /> €
                </button>
              </div>

              <input
                type="number"
                value={budgetDiscount}
                onChange={(e) => setBudgetDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder={budgetDiscountType === 'porcentaje' ? 'Descuento %' : 'Descuento €'}
                min="0"
                max={budgetDiscountType === 'porcentaje' ? "100" : totales.subtotal}
              />

              <textarea
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Notas del presupuesto..."
              />

              <div className="bg-primary-50 p-4 rounded-xl border border-primary-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-800">TOTAL:</span>
                  <span className="text-2xl font-bold text-primary-600">{totales.total.toFixed(2)}€</span>
                </div>
                {totales.descuento > 0 && (
                  <p className="text-xs text-primary-600 mt-1">
                    Descuento aplicado: -{totales.descuento.toFixed(2)}€
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarPresupuesto}
                  disabled={totales.total <= 0}
                  className={`px-6 py-2.5 rounded-lg text-white font-medium ${
                    totales.total > 0 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Guardar presupuesto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ENLACE */}
      {showLinkModal && budgetLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Share2 className="w-5 h-5 mr-2 text-primary-500" />
                Compartir presupuesto
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800 mb-2 font-medium">🔗 Enlace único:</p>
                <div className="bg-white p-3 rounded-lg border border-blue-200 text-sm break-all font-mono">
                  {budgetLink.url}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(budgetLink.url);
                    setCopySuccess('¡Copiado!');
                    setTimeout(() => setCopySuccess(''), 2000);
                  }}
                  className="py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copySuccess || 'Copiar'}</span>
                </button>

                <a
                  href={`https://wa.me/${client?.phone?.replace(/\s+/g, '')}?text=${encodeURIComponent(
                    `Hola ${client.name}, aquí tiene su presupuesto:\n\n${budgetLink.url}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 bg-green-600 text-white rounded-lg flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => generatePDF('cliente')} className="py-3 border-2 border-gray-300 rounded-lg flex items-center justify-center space-x-2">
                  <FileDown className="w-4 h-4" />
                  <span>PDF cliente</span>
                </button>
                <button onClick={() => generatePDF('taller')} className="py-3 border-2 border-gray-300 rounded-lg flex items-center justify-center space-x-2">
                  <FileDown className="w-4 h-4" />
                  <span>PDF taller</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleReparacion;