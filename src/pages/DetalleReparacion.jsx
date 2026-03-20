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
  Euro,
  FileDown,
  Paperclip,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReceptionPDF } from '../utils/pdfGenerator';
import TrabajosPorFamilia from '../components/orders/TrabajosPorFamilia';
import FallosPorFamilia from '../components/orders/FallosPorFamilia';
import TrazabilidadTimeline from '../components/orders/TrazabilidadTimeline';
import { supabase } from '../lib/supabaseClient';

// Datos de la empresa
const EMPRESA = {
  nombre: 'LAM-RELOJEROS S.L',
  cif: 'B-88615489',
  telefono: '672373275',
  direccion: 'C/ Ejemplo, 123',
  ciudad: '28001 Madrid'
};

const IVA_PORCENTAJE = 21;

function DetalleReparacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, clients, updateOrder, generateBudgetLink } = useApp();
  
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trabajos');
  
  const [trabajosSeleccionados, setTrabajosSeleccionados] = useState([]);
  const [fallosSeleccionados, setFallosSeleccionados] = useState([]);
  const [familiasTrabajos, setFamiliasTrabajos] = useState([]);
  
  const [diagnosis, setDiagnosis] = useState({
    observaciones: '',
    recomendaciones: '',
    tiempo_estimado: '',
    urgencia: 'normal'
  });
  
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetDiscount, setBudgetDiscount] = useState(0);
  const [budgetDiscountType, setBudgetDiscountType] = useState('porcentaje');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [budgetLink, setBudgetLink] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  const tabs = [
    { id: 'editar', label: 'EDITAR', icon: Edit },
    { id: 'fallos', label: 'FALLOS', icon: AlertTriangle },
    { id: 'trabajos', label: 'TRABAJOS', icon: Wrench },
    { id: 'productos', label: 'PRODUCTOS', icon: Package },
    { id: 'archivos', label: 'ARCHIVOS', icon: FileText },
    { id: 'trazabilidad', label: 'TRAZABILIDAD', icon: BarChart },
    { id: 'conversacion', label: 'CONVERSACIÓN', icon: MessageCircle }
  ];

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

  // Calcular totales con IVA
  const calcularTotales = () => {
    const trabajosTotal = trabajosSeleccionados.reduce((sum, t) => {
      return sum + (t.total || t.tarifa_aplicada * (t.cantidad || 1) || 0);
    }, 0);
    
    const fallosTotal = fallosSeleccionados.reduce((sum, f) => sum + (f.total || 0), 0);
    const subtotalConIVA = trabajosTotal + fallosTotal;
    
    let descuentoAplicado = 0;
    if (budgetDiscount > 0) {
      if (budgetDiscountType === 'porcentaje') {
        descuentoAplicado = subtotalConIVA * (budgetDiscount / 100);
      } else {
        descuentoAplicado = Math.min(budgetDiscount, subtotalConIVA);
      }
    }
    
    const totalConIVA = subtotalConIVA - descuentoAplicado;
    const baseImponible = totalConIVA / (1 + IVA_PORCENTAJE / 100);
    const iva = totalConIVA - baseImponible;
    
    return {
      trabajos: trabajosTotal,
      fallos: fallosTotal,
      subtotalConIVA,
      descuento: descuentoAplicado,
      totalConIVA,
      baseImponible,
      iva
    };
  };

  const totales = calcularTotales();

  const guardarPresupuesto = async () => {
    try {
      await updateOrder(order.id, {
        trabajos: trabajosSeleccionados,
        fallos: fallosSeleccionados,
        budget: totales.totalConIVA,
        budget_discount: totales.descuento,
        budget_notes: budgetNotes,
        budget_status: 'pendiente',
        status: 'Presupuestado',
        budget_date: new Date().toISOString()
      });
      
      setShowBudgetModal(false);
      setSuccessMessage('✅ Presupuesto generado correctamente');
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        navigate(`/presupuesto/taller/${order.id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error guardando presupuesto:', error);
      alert('Error al guardar el presupuesto: ' + error.message);
    }
  };

  const generatePDF = (type) => {
    if (order && client) {
      generateReceptionPDF(order, client, type);
    }
  };

  const handleViewBudget = () => {
    navigate(`/presupuesto/taller/${order.id}`);
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

      {/* Header superior - Diseño profesional blanco/negro */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Primera línea: Estado y navegación */}
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/reparaciones-activas')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Home / Reparaciones /</span>
                <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                  REPARACIÓN - {order.order_number}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Segunda línea: Mensaje de actualización */}
          <div className="px-6 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center text-sm text-yellow-700">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <p>
                Si quiere actualizar esta reparación, debe ir al último presupuesto asociado y rechazarlo.
              </p>
            </div>
          </div>

          {/* Tercera línea: Info rápida */}
          <div className="px-6 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium text-gray-800">{client.name}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-1 text-gray-400" />
                  {client.phone}
                </div>
                {client.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-1 text-gray-400" />
                    {client.email}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
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
            
            {order.status === 'Presupuestado' && (
              <button
                onClick={handleViewBudget}
                className="flex items-center space-x-2 px-5 py-4 text-sm font-medium text-green-600 border-b-2 border-green-500 hover:bg-green-50 transition-all ml-auto"
              >
                <Eye className="w-4 h-4" />
                <span>VER PRESUPUESTO</span>
              </button>
            )}
          </div>

          <div className="p-6">
            {/* PESTAÑA TRABAJOS */}
            {activeTab === 'trabajos' && (
              <div className="space-y-6">
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
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={guardarDiagnostico}
                    className="px-6 py-2.5 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 flex items-center space-x-2 transition-colors font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar diagnóstico</span>
                  </button>
                  
                  {(trabajosSeleccionados.length > 0 || fallosSeleccionados.length > 0) && order.status !== 'Presupuestado' && (
                    <button
                      onClick={() => setShowBudgetModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Generar presupuesto</span>
                    </button>
                  )}

                  {order.status === 'Presupuestado' && (
                    <button
                      onClick={handleViewBudget}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver presupuesto</span>
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

      {/* MODAL DE PRESUPUESTO - VERSIÓN PROFESIONAL */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-scale-up">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-t-2xl border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Generar presupuesto</h3>
                    <p className="text-sm text-gray-500">Revisa los detalles antes de continuar</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBudgetModal(false)} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Resumen de trabajos */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700 text-sm">Trabajos seleccionados</h4>
                  <span className="text-xs text-gray-500">{trabajosSeleccionados.length} ítems</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {trabajosSeleccionados.slice(0, 4).map((t, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.nombre}</span>
                      <span className="font-medium">{(t.total || t.tarifa_aplicada || 0).toFixed(2)}€</span>
                    </div>
                  ))}
                  {trabajosSeleccionados.length > 4 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      + {trabajosSeleccionados.length - 4} trabajos más
                    </p>
                  )}
                </div>
              </div>

              {/* Cálculo con IVA */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Subtotal (IVA incluido)</span>
                  <span className="font-medium">{totales.subtotalConIVA.toFixed(2)}€</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Descuento</span>
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setBudgetDiscountType('porcentaje')}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          budgetDiscountType === 'porcentaje' 
                            ? 'bg-white shadow-sm text-primary-600' 
                            : 'text-gray-500'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetDiscountType('euros')}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          budgetDiscountType === 'euros' 
                            ? 'bg-white shadow-sm text-primary-600' 
                            : 'text-gray-500'
                        }`}
                      >
                        €
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={budgetDiscount}
                      onChange={(e) => setBudgetDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 text-right px-2 py-1 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 text-sm"
                      placeholder="0"
                      min="0"
                      max={budgetDiscountType === 'porcentaje' ? "100" : totales.subtotalConIVA}
                    />
                    {budgetDiscountType === 'porcentaje' && <span className="text-sm text-gray-500">%</span>}
                  </div>
                </div>
                
                {totales.descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento aplicado</span>
                    <span>- {totales.descuento.toFixed(2)}€</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 my-2 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base imponible</span>
                    <span>{totales.baseImponible.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-gray-600 mt-1">
                    <span>IVA ({IVA_PORCENTAJE}%)</span>
                    <span>{totales.iva.toFixed(2)}€</span>
                  </div>
                </div>
                
                <div className="bg-primary-50 p-4 rounded-xl border border-primary-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary-800 text-lg">TOTAL (IVA incluido)</span>
                    <span className="text-2xl font-bold text-primary-600">{totales.totalConIVA.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas para el cliente
                </label>
                <textarea
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Añade información adicional para el cliente (plazo de entrega, condiciones, etc.)..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarPresupuesto}
                disabled={totales.subtotalConIVA <= 0}
                className={`px-5 py-2.5 rounded-xl text-white font-medium transition-all flex items-center space-x-2 ${
                  totales.subtotalConIVA > 0 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Generar presupuesto</span>
              </button>
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