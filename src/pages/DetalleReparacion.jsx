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
  Settings,
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
  Download,
  Share2,
  Tag,
  Filter,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Hash,
  Euro,
  BadgePercent,
  FileDown,
  FileUp,
  History,
  MessageSquare,
  Paperclip,
  Camera,
  Mic,
  MoreVertical,
  Star,
  Award,
  Shield,
  Zap,
  TrendingUp,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  CheckSquare,
  Square,
  MinusCircle,
  PlusCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReceptionPDF } from '../utils/pdfGenerator';
import TrabajosPorFamilia from '../components/orders/TrabajosPorFamilia';
import FallosPorFamilia from '../components/orders/FallosPorFamilia';
import TrazabilidadTimeline from '../components/orders/TrazabilidadTimeline';

function DetalleReparacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, clients, updateOrder, generateBudgetLink } = useApp();
  
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trabajos');
  const [activeSubTab, setActiveSubTab] = useState('lista'); // 'lista' o 'selector'
  
  // Estados para trabajos seleccionados
  const [trabajosSeleccionados, setTrabajosSeleccionados] = useState([]);
  const [fallosSeleccionados, setFallosSeleccionados] = useState([]);
  
  // Estados para tipos de selección
  const [tiposSeleccion, setTiposSeleccion] = useState({
    obligatorio: true,
    sugerido: false,
    seleccionado_cliente: false,
    descartado_cliente: false
  });
  
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
  const [budgetDiscountType, setBudgetDiscountType] = useState('porcentaje'); // 'porcentaje' o 'euros'
  const [budgetNotes, setBudgetNotes] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [budgetLink, setBudgetLink] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [familiasExpandidas, setFamiliasExpandidas] = useState({});
  const [modoEdicion, setModoEdicion] = useState(false);
  const [trabajoEditando, setTrabajoEditando] = useState(null);

  // Calcular contadores por familia
  const contadoresFamilias = React.useMemo(() => {
    const contadores = {
      seleccionado: trabajosSeleccionados.length,
      bisel: 0,
      brazalete: 0,
      carrura: 1,
      corona: 0,
      cristal: 0,
      descuentos: 0,
      esfera: 0,
      especial: 0,
      hermetismos: 0,
      maquina: 0,
      parciales_cuarzo: 0,
      parciales_mecanicos: 0
    };
    
    // Aquí puedes mapear los trabajos seleccionados a familias
    trabajosSeleccionados.forEach(t => {
      // Lógica para asignar a familias según el trabajo
      if (t.nombre?.toLowerCase().includes('brazalete')) contadores.brazalete++;
      if (t.nombre?.toLowerCase().includes('carrura')) contadores.carrura++;
      // ... más lógica según tu negocio
    });
    
    return contadores;
  }, [trabajosSeleccionados]);

  // Pestañas principales
  const tabs = [
    { id: 'editar', label: 'EDITAR', icon: Edit, color: 'text-gray-600' },
    { id: 'fallos', label: 'FALLOS', icon: AlertTriangle, color: 'text-red-600' },
    { id: 'trabajos', label: 'TRABAJOS', icon: Wrench, color: 'text-blue-600' },
    { id: 'productos', label: 'PRODUCTOS', icon: Package, color: 'text-purple-600' },
    { id: 'archivos', label: 'ARCHIVOS', icon: FileText, color: 'text-green-600' },
    { id: 'archivos_referencia', label: 'ARCHIVOS REFERENCIA', icon: FileText, color: 'text-emerald-600' },
    { id: 'c_calidad', label: 'C. CALIDAD', icon: Shield, color: 'text-indigo-600' },
    { id: 'trazabilidad', label: 'TRAZABILIDAD', icon: BarChart, color: 'text-orange-600' },
    { id: 'conversacion', label: 'CONVERSACIÓN', icon: MessageCircle, color: 'text-pink-600' }
  ];

  // Familias para la leyenda
  const familias = [
    { id: 'seleccionado', label: 'Seleccionado', count: contadoresFamilias.seleccionado, color: 'bg-blue-500' },
    { id: 'bisel', label: 'Bisel', count: contadoresFamilias.bisel, color: 'bg-gray-500' },
    { id: 'brazalete', label: 'Brazalete', count: contadoresFamilias.brazalete, color: 'bg-gray-500' },
    { id: 'carrura', label: 'Carrura', count: contadoresFamilias.carrura, color: 'bg-orange-500' },
    { id: 'corona', label: 'Corona', count: contadoresFamilias.corona, color: 'bg-gray-500' },
    { id: 'cristal', label: 'Cristal', count: contadoresFamilias.cristal, color: 'bg-gray-500' },
    { id: 'descuentos', label: 'Descuentos', count: contadoresFamilias.descuentos, color: 'bg-green-500' },
    { id: 'esfera', label: 'Esfera', count: contadoresFamilias.esfera, color: 'bg-gray-500' },
    { id: 'especial', label: 'Especial', count: contadoresFamilias.especial, color: 'bg-purple-500' },
    { id: 'hermetismos', label: 'Hermetismos', count: contadoresFamilias.hermetismos, color: 'bg-gray-500' },
    { id: 'maquina', label: 'Máquina', count: contadoresFamilias.maquina, color: 'bg-gray-500' },
    { id: 'parciales_cuarzo', label: 'Parciales cuarzo', count: contadoresFamilias.parciales_cuarzo, color: 'bg-gray-500' },
    { id: 'parciales_mecanicos', label: 'Parciales mecánicos', count: contadoresFamilias.parciales_mecanicos, color: 'bg-gray-500' }
  ];

  // Tipos de selección
  const tiposSeleccionList = [
    { id: 'obligatorio', label: 'Obligatorio', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: '🔴' },
    { id: 'sugerido', label: 'Sugerido', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: '🔵' },
    { id: 'seleccionado_cliente', label: 'Seleccionado por el Cliente', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: '🟢' },
    { id: 'descartado_cliente', label: 'Descartado por el Cliente', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: '⚪' }
  ];

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

  // Calcular totales
  const totales = React.useMemo(() => {
    const trabajosTotal = trabajosSeleccionados.reduce((sum, t) => sum + (t.total || t.tarifa_aplicada || t.tarifa_base || 0), 0);
    const fallosTotal = fallosSeleccionados.reduce((sum, f) => sum + (f.total || f.tarifa_aplicada || 0), 0);
    const subtotal = trabajosTotal + fallosTotal;
    
    let descuentoAplicado = 0;
    if (budgetDiscountType === 'porcentaje') {
      descuentoAplicado = subtotal * (budgetDiscount / 100);
    } else {
      descuentoAplicado = budgetDiscount;
    }
    
    return {
      trabajos: trabajosTotal,
      fallos: fallosTotal,
      subtotal: subtotal,
      descuento: descuentoAplicado,
      total: subtotal - descuentoAplicado
    };
  }, [trabajosSeleccionados, fallosSeleccionados, budgetDiscount, budgetDiscountType]);

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

  const guardarPresupuesto = async () => {
    await updateOrder(order.id, {
      trabajos: trabajosSeleccionados,
      fallos: fallosSeleccionados,
      budget: totales.total,
      budget_discount: totales.descuento,
      budget_discount_type: budgetDiscountType,
      budget_notes: budgetNotes,
      budget_status: 'pendiente',
      status: 'Presupuestado',
      budget_date: new Date().toISOString()
    });
    
    setShowBudgetModal(false);
    setSuccessMessage('✅ Presupuesto generado correctamente');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
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

  const toggleTipoSeleccion = (tipoId) => {
    setTiposSeleccion(prev => ({
      ...prev,
      [tipoId]: !prev[tipoId]
    }));
  };

  const updateTrabajoPrecio = (trabajoId, campo, valor) => {
    setTrabajosSeleccionados(prev =>
      prev.map(t => {
        if (t.id === trabajoId || t.trabajo_id === trabajoId) {
          const updated = { ...t, [campo]: valor };
          
          // Recalcular total
          const tarifa = campo === 'tarifa_aplicada' ? valor : t.tarifa_aplicada;
          const descuento = campo === 'descuento' ? valor : t.descuento;
          const cantidad = campo === 'cantidad' ? valor : t.cantidad;
          
          updated.total = (tarifa * (cantidad || 1)) * (1 - (descuento || 0) / 100);
          
          return updated;
        }
        return t;
      })
    );
  };

  const eliminarTrabajo = (trabajoId) => {
    setTrabajosSeleccionados(prev => prev.filter(t => t.id !== trabajoId && t.trabajo_id !== trabajoId));
    setSuccessMessage('Trabajo eliminado');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2000);
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

      {/* Header superior - ESTILO CAPTURA */}
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
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500' : tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* PESTAÑA TRABAJOS - DISEÑO PROFESIONAL */}
            {activeTab === 'trabajos' && (
              <div className="space-y-6">
                {/* Leyenda de familias - ESTILO CAPTURA */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-gray-500" />
                      Familias de trabajos
                    </h3>
                    <span className="text-xs text-gray-500">Haz clic para filtrar</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {familias.map((familia) => (
                      <button
                        key={familia.id}
                        onClick={() => setFamiliasExpandidas(prev => ({ ...prev, [familia.id]: !prev[familia.id] }))}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-lg text-sm
                          transition-all hover:shadow-md border
                          ${familia.count > 0 
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="text-gray-700">{familia.label}</span>
                        {familia.count > 0 ? (
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs text-white ${familia.color}`}>
                            {familia.count}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                            0
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipos de selección - ESTILO CAPTURA */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-gray-500" />
                      Tipo de selección
                    </h3>
                  </div>
                  <div className="p-4 flex flex-wrap gap-4">
                    {tiposSeleccionList.map((tipo) => (
                      <label
                        key={tipo.id}
                        className={`
                          flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer
                          transition-all border-2
                          ${tiposSeleccion[tipo.id] 
                            ? `${tipo.bgColor} ${tipo.borderColor} border-2` 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={tiposSeleccion[tipo.id]}
                          onChange={() => toggleTipoSeleccion(tipo.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className={`text-sm font-medium ${tipo.color}`}>
                          {tipo.icon} {tipo.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sub-pestañas: Lista de trabajos o Selector por familias */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 flex">
                    <button
                      onClick={() => setActiveSubTab('lista')}
                      className={`
                        px-6 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeSubTab === 'lista'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                        }
                      `}
                    >
                      📋 Lista de trabajos
                    </button>
                    <button
                      onClick={() => setActiveSubTab('selector')}
                      className={`
                        px-6 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeSubTab === 'selector'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                        }
                      `}
                    >
                      🔍 Selector por familias
                    </button>
                  </div>

                  <div className="p-4">
                    {activeSubTab === 'lista' ? (
                      /* TABLA DE TRABAJOS - ESTILO CAPTURA */
                      <div className="space-y-4">
                        {trabajosSeleccionados.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trabajo
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tarifa base
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tarifa aplicada
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dto %
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cant.
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {trabajosSeleccionados.map((trabajo) => {
                                  const editando = trabajoEditando === (trabajo.id || trabajo.trabajo_id);
                                  
                                  return (
                                    <tr key={trabajo.id || trabajo.trabajo_id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`
                                          w-6 h-6 rounded-full flex items-center justify-center text-xs
                                          ${trabajo.tipo_seleccion === 'obligatorio' ? 'bg-red-100 text-red-600' : ''}
                                          ${trabajo.tipo_seleccion === 'sugerido' ? 'bg-blue-100 text-blue-600' : ''}
                                          ${trabajo.tipo_seleccion === 'seleccionado_cliente' ? 'bg-green-100 text-green-600' : ''}
                                          ${trabajo.tipo_seleccion === 'descartado' ? 'bg-gray-100 text-gray-600' : ''}
                                        `}>
                                          {trabajo.tipo_seleccion === 'obligatorio' && '🔴'}
                                          {trabajo.tipo_seleccion === 'sugerido' && '🔵'}
                                          {trabajo.tipo_seleccion === 'seleccionado_cliente' && '🟢'}
                                          {trabajo.tipo_seleccion === 'descartado' && '⚪'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {trabajo.nombre}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                                        {trabajo.tarifa_base?.toFixed(2)}€
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right">
                                        {editando ? (
                                          <input
                                            type="number"
                                            defaultValue={trabajo.tarifa_aplicada}
                                            onChange={(e) => updateTrabajoPrecio(trabajo.id || trabajo.trabajo_id, 'tarifa_aplicada', parseFloat(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 text-right border rounded text-sm"
                                            step="0.01"
                                            autoFocus
                                          />
                                        ) : (
                                          <span 
                                            onClick={() => setTrabajoEditando(trabajo.id || trabajo.trabajo_id)}
                                            className="cursor-pointer hover:text-primary-600 font-medium"
                                          >
                                            {trabajo.tarifa_aplicada?.toFixed(2)}€
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right">
                                        {editando ? (
                                          <input
                                            type="number"
                                            defaultValue={trabajo.descuento}
                                            onChange={(e) => updateTrabajoPrecio(trabajo.id || trabajo.trabajo_id, 'descuento', parseFloat(e.target.value) || 0)}
                                            className="w-16 px-2 py-1 text-right border rounded text-sm"
                                            step="0.1"
                                          />
                                        ) : (
                                          <span 
                                            onClick={() => setTrabajoEditando(trabajo.id || trabajo.trabajo_id)}
                                            className="cursor-pointer hover:text-primary-600"
                                          >
                                            {trabajo.descuento || 0}%
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right">
                                        {editando ? (
                                          <input
                                            type="number"
                                            defaultValue={trabajo.cantidad || 1}
                                            onChange={(e) => updateTrabajoPrecio(trabajo.id || trabajo.trabajo_id, 'cantidad', parseInt(e.target.value) || 1)}
                                            className="w-16 px-2 py-1 text-right border rounded text-sm"
                                            min="1"
                                          />
                                        ) : (
                                          <span 
                                            onClick={() => setTrabajoEditando(trabajo.id || trabajo.trabajo_id)}
                                            className="cursor-pointer hover:text-primary-600"
                                          >
                                            {trabajo.cantidad || 1}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right font-medium text-primary-600">
                                        {(trabajo.total || 0).toFixed(2)}€
                                      </td>
                                      <td className="px-4 py-3 text-sm text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                          {editando ? (
                                            <button
                                              onClick={() => setTrabajoEditando(null)}
                                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            >
                                              <CheckCircle className="w-4 h-4" />
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => setTrabajoEditando(trabajo.id || trabajo.trabajo_id)}
                                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                              <Edit className="w-4 h-4" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => eliminarTrabajo(trabajo.id || trabajo.trabajo_id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                <tr>
                                  <td colSpan="6" className="px-4 py-3 text-right font-bold text-gray-700">
                                    TOTAL TRABAJOS:
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-primary-600 text-lg">
                                    {totales.trabajos.toFixed(2)}€
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No hay trabajos seleccionados</p>
                            <p className="text-sm text-gray-400 mt-1">Ve a "Selector por familias" para añadir trabajos</p>
                          </div>
                        )}

                        {/* Botones Varios y Dto % - ESTILO CAPTURA */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-3">
                            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors">
                              <Layers className="w-4 h-4 text-gray-500" />
                              <span>Varios</span>
                            </button>
                            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors">
                              <Percent className="w-4 h-4 text-gray-500" />
                              <span>Dto %</span>
                            </button>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">Mínimo:</span>
                            <span className="text-2xl font-bold text-primary-600">49€</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Selector por familias - TU COMPONENTE EXISTENTE */
                      <TrabajosPorFamilia 
                        ordenId={order.id}
                        onTrabajosChange={setTrabajosSeleccionados}
                        trabajosIniciales={trabajosSeleccionados}
                      />
                    )}
                  </div>
                </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={diagnosis.observaciones}
                    onChange={(e) => setDiagnosis({...diagnosis, observaciones: e.target.value})}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Añade observaciones sobre la reparación..."
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recomendaciones
                  </label>
                  <textarea
                    value={diagnosis.recomendaciones}
                    onChange={(e) => setDiagnosis({...diagnosis, recomendaciones: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Recomendaciones para el cliente..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo estimado
                    </label>
                    <input
                      type="text"
                      value={diagnosis.tiempo_estimado}
                      onChange={(e) => setDiagnosis({...diagnosis, tiempo_estimado: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ej: 3-5 días"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgencia
                    </label>
                    <select
                      value={diagnosis.urgencia}
                      onChange={(e) => setDiagnosis({...diagnosis, urgencia: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="baja">🔵 Baja</option>
                      <option value="normal">🟢 Normal</option>
                      <option value="alta">🟠 Alta</option>
                      <option value="urgente">🔴 Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={guardarDiagnostico}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA TRAZABILIDAD */}
            {activeTab === 'trazabilidad' && (
              <TrazabilidadTimeline orden={order} />
            )}

            {/* Otras pestañas (placeholder) */}
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

      {/* MODAL DE PRESUPUESTO - PROFESIONAL */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-500" />
                Generar presupuesto
              </h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
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

              {/* Tipo de descuento */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setBudgetDiscountType('porcentaje')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    budgetDiscountType === 'porcentaje'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Percent className="w-4 h-4 inline mr-1" />
                  Porcentaje
                </button>
                <button
                  onClick={() => setBudgetDiscountType('euros')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    budgetDiscountType === 'euros'
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Euro className="w-4 h-4 inline mr-1" />
                  Euros
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento {budgetDiscountType === 'porcentaje' ? '(%)' : '(€)'}
                </label>
                <input
                  type="number"
                  value={budgetDiscount}
                  onChange={(e) => setBudgetDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                  step={budgetDiscountType === 'porcentaje' ? "1" : "0.01"}
                  min="0"
                  max={budgetDiscountType === 'porcentaje' ? "100" : totales.subtotal}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas del presupuesto
                </label>
                <textarea
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Incluye información adicional para el cliente..."
                />
              </div>

              {/* Total final */}
              <div className="bg-primary-50 p-4 rounded-xl border border-primary-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-800">TOTAL PRESUPUESTO:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {totales.total.toFixed(2)}€
                  </span>
                </div>
                {budgetDiscount > 0 && (
                  <p className="text-xs text-primary-600 mt-1">
                    Descuento aplicado: -{totales.descuento.toFixed(2)}€
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={guardarPresupuesto}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Guardar presupuesto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ENLACE - PROFESIONAL */}
      {showLinkModal && budgetLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Share2 className="w-5 h-5 mr-2 text-primary-500" />
                Compartir presupuesto
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
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
                  className="py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 transition-colors font-medium"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{copySuccess}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/${client?.phone?.replace(/\s+/g, '')}?text=${encodeURIComponent(
                    `Hola ${client.name}, aquí tiene el presupuesto de su reparación:\n\n${budgetLink.url}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => generatePDF('cliente')}
                  className="py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>PDF cliente</span>
                </button>
                <button
                  onClick={() => generatePDF('taller')}
                  className="py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 transition-colors"
                >
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