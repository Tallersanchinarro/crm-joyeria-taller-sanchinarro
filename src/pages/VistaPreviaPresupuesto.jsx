import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  Send,
  Copy,
  FileText,
  Euro,
  Percent,
  User,
  Phone,
  Mail,
  Package,
  Wrench,
  AlertTriangle,
  Gem,
  Calendar,
  RefreshCw,
  ExternalLink,
  Clock,
  FileSignature,
  Building,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateBudgetPDF } from '../utils/pdfGeneratorBudget';
import { supabase } from '../lib/supabaseClient';

// Configuración del IVA
const IVA_PORCENTAJE = 21;

// Datos de la empresa
const EMPRESA = {
  nombre: 'LAM-RELOJEROS S.L',
  cif: 'B-88615489',
  telefono: '672373275',
  email: 'tallersanchinarro@rubiorelojeros.com',
  direccion: 'C/ Margarita de Parma, 1',
  ciudad: '28050 Madrid'
};

function VistaPreviaPresupuesto() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, clients, updateOrder, generateBudgetLink } = useApp();
  
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [budgetLink, setBudgetLink] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('presupuesto');

  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      console.log('🔄 Cargando datos de la orden:', orderId);
      
      // Buscar la orden en el contexto primero
      let foundOrder = orders.find(o => o.id === orderId);
      
      if (!foundOrder) {
        const { data, error } = await supabase
          .from('ordenes')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (error) throw error;
        foundOrder = data;
      }

      setOrder(foundOrder);
      
      // Buscar cliente
      let foundClient = clients.find(c => c.id === foundOrder.client_id);
      
      if (!foundClient && foundOrder.client_id) {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', foundOrder.client_id)
          .single();
        
        if (!error) foundClient = data;
      }
      
      setClient(foundClient);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular subtotales con IVA (el precio ya incluye IVA)
  const calcularSubtotales = () => {
    if (!order) return { 
      trabajos: 0, 
      fallos: 0, 
      subtotalConIVA: 0, 
      descuento: 0,
      totalConIVA: 0,
      baseImponible: 0, 
      iva: 0,
      trabajosList: [],
      fallosList: []
    };

    const trabajosList = order.trabajos || [];
    const fallosList = order.fallos || [];

    const trabajosTotal = trabajosList.reduce((sum, t) => {
      return sum + (t.total || t.tarifa_aplicada * (t.cantidad || 1) || 0);
    }, 0);

    const fallosTotal = fallosList.reduce((sum, f) => {
      return sum + (f.total || 0);
    }, 0);

    const subtotalConIVA = trabajosTotal + fallosTotal;
    
    // Aplicar descuento
    let descuentoAplicado = order.budget_discount || 0;
    
    const totalConIVA = subtotalConIVA - descuentoAplicado;
    
    // Calcular base imponible e IVA (el total ya incluye IVA)
    const baseImponible = totalConIVA / (1 + IVA_PORCENTAJE / 100);
    const iva = totalConIVA - baseImponible;

    return { 
      trabajos: trabajosTotal, 
      fallos: fallosTotal, 
      subtotalConIVA, 
      descuento: descuentoAplicado,
      totalConIVA,
      baseImponible, 
      iva,
      trabajosList,
      fallosList
    };
  };

  const totales = calcularSubtotales();

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const link = await generateBudgetLink(order.id);
      setBudgetLink(link);
      setCopySuccess('');
      setSuccessMessage('✅ Enlace generado correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      alert('Error generando enlace: ' + error.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    if (!budgetLink) return;
    navigator.clipboard.writeText(budgetLink.url);
    setCopySuccess('¡Copiado!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleWhatsApp = () => {
    if (!client || !budgetLink) return;
    const message = `*PRESUPUESTO DE REPARACIÓN*\n\nHola ${client.name}, aquí tiene el presupuesto de su ${order?.item_type}:\n\n💰 *Total: ${totales.totalConIVA.toFixed(2)}€*\n\nPuede ver el detalle completo y aceptarlo directamente desde este enlace:\n${budgetLink.url}\n\nSaludos cordiales.`;
    window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await updateOrder(order.id, {
        status: newStatus,
        budget_status: newStatus === 'Aceptado' ? 'aceptado' : 
                      newStatus === 'Rechazado' ? 'rechazado' : 'pendiente'
      });
      setOrder(prev => ({ ...prev, status: newStatus }));
      setSuccessMessage(`✅ Presupuesto ${newStatus === 'Aceptado' ? 'aceptado' : 'rechazado'}`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      alert('Error al cambiar estado: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintPDF = async () => {
    if (order && client) {
      await generateBudgetPDF(
        order, 
        client, 
        totales.descuento, 
        'euros', 
        order.budget_notes || ''
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Recibido': 'bg-purple-100 text-purple-700 border-purple-200',
      'En análisis': 'bg-blue-100 text-blue-700 border-blue-200',
      'Presupuestado': 'bg-amber-100 text-amber-700 border-amber-200',
      'Aceptado': 'bg-green-100 text-green-700 border-green-200',
      'Rechazado': 'bg-red-100 text-red-700 border-red-200',
      'En reparación': 'bg-orange-100 text-orange-700 border-orange-200',
      'Listo': 'bg-green-100 text-green-700 border-green-200',
      'Entregado': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getGravedadColor = (gravedad) => {
    const colores = {
      'baja': 'bg-green-100 text-green-700',
      'media': 'bg-yellow-100 text-yellow-700',
      'alta': 'bg-orange-100 text-orange-700',
      'critica': 'bg-red-100 text-red-700'
    };
    return colores[gravedad] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
            <Gem className="w-8 h-8 text-primary-600 absolute top-6 left-1/2 transform -translate-x-1/2" />
          </div>
          <p className="text-gray-600 text-lg">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (!order || !client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Presupuesto no encontrado</h2>
          <p className="text-gray-500 mb-6">El presupuesto que buscas no existe o ha sido eliminado.</p>
          <button onClick={() => navigate('/reparaciones-activas')} className="btn-primary">
            Volver a reparaciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Mensaje de éxito flotante */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Barra de navegación superior */}
        <div className="bg-white rounded-t-2xl shadow-md p-4 mb-0 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/reparacion/${order.id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver a la reparación"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  Presupuesto #{order.order_number}
                </h1>
                <p className="text-sm text-gray-500">
                  Creado: {formatDate(order.budget_date || order.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <button
                onClick={handlePrintPDF}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Imprimir/PDF"
              >
                <Printer className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de navegación interna */}
        <div className="bg-white px-4 border-b border-gray-200 flex space-x-6">
          <button
            onClick={() => setActiveTab('presupuesto')}
            className={`py-3 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'presupuesto'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Presupuesto
          </button>
          <button
            onClick={() => setActiveTab('compartir')}
            className={`py-3 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'compartir'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📱 Compartir
          </button>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-b-2xl shadow-xl p-8">
          {activeTab === 'presupuesto' ? (
            /* ===== VISTA PRESUPUESTO (ESTILO FOLIO) ===== */
            <div className="space-y-8">
              {/* Cabecera del folio */}
              <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">PRESUPUESTO</h2>
                  <p className="text-sm text-gray-500 mt-1">Nº {order.order_number}</p>
                </div>
                <div className="text-right">
                  <div className="bg-primary-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="font-bold text-gray-800">{formatDate(order.budget_date || order.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Datos del taller y cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-200 pb-6">
                <div>
                  <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-primary-600" />
                    Taller
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-medium">{EMPRESA.nombre}</p>
                    <p className="text-gray-600">{EMPRESA.direccion}</p>
                    <p className="text-gray-600">{EMPRESA.ciudad}</p>
                    <p className="text-gray-600">CIF: {EMPRESA.cif}</p>
                    <p className="text-gray-600">Tel: {EMPRESA.telefono}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2 text-primary-600" />
                    Cliente
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-gray-600 flex items-center">
                      <Phone className="w-3 h-3 mr-2 text-gray-400" />
                      {client.phone}
                    </p>
                    {client.email && (
                      <p className="text-gray-600 flex items-center">
                        <Mail className="w-3 h-3 mr-2 text-gray-400" />
                        {client.email}
                      </p>
                    )}
                    {client.address && (
                      <p className="text-gray-600">{client.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción de la joya */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-primary-600" />
                  Joya a reparar
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Tipo</p>
                      <p className="font-medium">{order.item_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Material</p>
                      <p className="font-medium">{order.material}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Descripción</p>
                      <p className="text-sm">{order.description}</p>
                    </div>
                  </div>
                  {order.observations && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Observaciones:</p>
                      <p className="text-sm italic text-gray-600">{order.observations}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TRABAJOS A REALIZAR */}
              {totales.trabajosList.length > 0 && (
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                    <Wrench className="w-4 h-4 mr-2 text-primary-600" />
                    Trabajos a realizar
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Trabajo</th>
                          <th className="px-4 py-2 text-center">Cant.</th>
                          <th className="px-4 py-2 text-right">Precio</th>
                          <th className="px-4 py-2 text-right">Dto.</th>
                          <th className="px-4 py-2 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {totales.trabajosList.map((t, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{t.nombre}</td>
                            <td className="px-4 py-3 text-center">{t.cantidad || 1}</td>
                            <td className="px-4 py-3 text-right">{t.tarifa_aplicada?.toFixed(2)} €</td>
                            <td className="px-4 py-3 text-right">{t.descuento || 0}%</td>
                            <td className="px-4 py-3 text-right font-medium">{(t.total || 0).toFixed(2)} €</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FALLOS DETECTADOS */}
              {totales.fallosList.length > 0 && (
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                    Fallos detectados
                  </h3>
                  <div className="space-y-2">
                    {totales.fallosList.map((f, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getGravedadColor(f.gravedad)}`}>
                            {f.gravedad}
                          </span>
                          <span className="text-sm font-medium">{f.nombre}</span>
                        </div>
                        {f.observaciones && (
                          <span className="text-xs text-gray-500 italic ml-4">{f.observaciones}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTAS DEL PRESUPUESTO */}
              {order.budget_notes && (
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-bold text-gray-700 mb-3">Notas</h3>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    <FileSignature className="w-4 h-4 inline mr-2" />
                    {order.budget_notes}
                  </div>
                </div>
              )}

              {/* TOTALES CON IVA */}
              <div className="flex justify-end">
                <div className="w-full md:w-80 bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-4 text-center">RESUMEN</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal (IVA incl.)</span>
                      <span className="font-medium">{totales.subtotalConIVA.toFixed(2)} €</span>
                    </div>
                    {totales.descuento > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Descuento</span>
                        <span>- {totales.descuento.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2 mt-2">
                      <span className="text-gray-700">Base imponible</span>
                      <span>{totales.baseImponible.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA ({IVA_PORCENTAJE}%)</span>
                      <span>{totales.iva.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-3 mt-3">
                      <span className="text-gray-800">TOTAL (IVA incluido)</span>
                      <span className="text-primary-600">{totales.totalConIVA.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota legal */}
              <div className="text-xs text-gray-400 text-center border-t border-gray-200 pt-6">
                <p>Presupuesto válido por 30 días. Este documento no es una factura.</p>
                <p className="mt-1">Para cualquier consulta, contacte con nosotros.</p>
              </div>
            </div>
          ) : (
            /* ===== VISTA COMPARTIR ===== */
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Compartir presupuesto</h2>
              
              {/* Estado actual */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-4">Estado del presupuesto</h3>
                <div className="flex items-center justify-between">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleStatusChange('Aceptado')}
                      disabled={updating || order.status === 'Aceptado'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleStatusChange('Rechazado')}
                      disabled={updating || order.status === 'Rechazado'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>

              {/* Generar enlace */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-4">Enlace para el cliente</h3>
                {!budgetLink ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={generatingLink}
                    className="w-full p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {generatingLink ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                    <span>Generar enlace público</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-primary-200">
                      <p className="text-xs text-primary-600 mb-2">🔗 Enlace único para el cliente:</p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={budgetLink.url}
                          readOnly
                          className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          title="Copiar enlace"
                        >
                          {copySuccess ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-600" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleWhatsApp}
                      className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <Send className="w-5 h-5" />
                      <span>Enviar por WhatsApp</span>
                    </button>

                    <a
                      href={budgetLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center text-gray-700"
                    >
                      <ExternalLink className="w-5 h-5 inline mr-2" />
                      Ver como cliente
                    </a>
                  </div>
                )}
              </div>

              {/* Acciones adicionales */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-4">Acciones</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePrintPDF}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-white flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                    <span>Descargar PDF</span>
                  </button>
                  <button
                    onClick={() => navigate(`/reparacion/${order.id}`)}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-white flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VistaPreviaPresupuesto;