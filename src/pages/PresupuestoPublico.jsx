import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Gem,
  Phone,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Loader,
  Wrench,
  AlertTriangle,
  Euro,
  Calendar,
  User,
  Package,
  FileText,
  Shield,
  Percent,
  Building
} from 'lucide-react';

function PresupuestoPublico() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [actionTaken, setActionTaken] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [empresaConfig, setEmpresaConfig] = useState({
    nombre: 'LAM-RELOJEROS S.L',
    logo_url: null,
    telefono: '672373275',
    email: 'tallersanchinarro@rubiorelojeros.com',
    direccion: 'C/ Margarita de parma 1',
    ciudad: '28050 Madrid'
  });

  const IVA_PORCENTAJE = 21;

  // Cargar configuración de la empresa
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data: config, error } = await supabase
          .from('configuracion')
          .select('*')
          .single();

        if (!error && config) {
          setEmpresaConfig({
            nombre: config.empresa?.nombre || empresaConfig.nombre,
            logo_url: config.logo_url || null,
            telefono: config.empresa?.telefono || empresaConfig.telefono,
            email: config.empresa?.email || empresaConfig.email,
            direccion: config.empresa?.direccion || empresaConfig.direccion,
            ciudad: config.empresa?.ciudad || empresaConfig.ciudad
          });
        }
      } catch (error) {
        console.log('Usando configuración por defecto');
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    loadBudgetData();
  }, [token]);

  const loadBudgetData = async () => {
    try {
      // 1. Buscar el token
      const { data: tokenData, error: tokenError } = await supabase
        .from('budget_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError) throw new Error('Enlace no válido');
      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error('Este enlace ha expirado (válido 7 días)');
      }

      setTokenInfo(tokenData);

      // 2. Registrar que se vio
      await supabase
        .from('budget_tokens')
        .update({ 
          viewed_at: new Date().toISOString(),
          ip_address: 'registrado',
          user_agent: navigator.userAgent
        })
        .eq('id', tokenData.id);

      // 3. Cargar la orden
      const { data: orderData, error: orderError } = await supabase
        .from('ordenes')
        .select('*')
        .eq('id', tokenData.order_id)
        .single();

      if (orderError) throw new Error('Error al cargar el presupuesto');
      setOrder(orderData);

      // 4. Cargar el cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', orderData.client_id)
        .single();

      if (!clientError) setClient(clientData);

      // 5. Ver si ya respondió
      if (tokenData.client_action) {
        setActionTaken(true);
        setActionMessage(tokenData.client_action === 'aceptado' 
          ? '✅ Ya has aceptado este presupuesto. Te contactaremos para comenzar la reparación.' 
          : '❌ Ya has rechazado este presupuesto. Si cambias de opinión, contáctanos.');
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientResponse = async (response) => {
    if (actionTaken || updating) return;

    setUpdating(true);

    try {
      // 1. Actualizar el token
      const { error: tokenError } = await supabase
        .from('budget_tokens')
        .update({ 
          client_action: response,
          action_date: new Date().toISOString()
        })
        .eq('id', tokenInfo.id);

      if (tokenError) throw tokenError;

      // 2. Actualizar la orden
      const { error: orderError } = await supabase
        .from('ordenes')
        .update({ 
          budget_status: response,
          status: response === 'aceptado' ? 'Aceptado' : 'Rechazado'
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      setActionTaken(true);
      setActionMessage(response === 'aceptado' 
        ? '✅ ¡Presupuesto aceptado! En breve nos pondremos con la reparación.'
        : '❌ Presupuesto rechazado. Si tienes alguna duda, no dudes en contactarnos.');

    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar tu respuesta. Por favor, inténtalo de nuevo o contáctanos.');
    } finally {
      setUpdating(false);
    }
  };

  // Función para obtener color de gravedad
  const getGravedadColor = (gravedad) => {
    const colores = {
      'baja': 'bg-green-100 text-green-700',
      'media': 'bg-yellow-100 text-yellow-700',
      'alta': 'bg-orange-100 text-orange-700',
      'critica': 'bg-red-100 text-red-700'
    };
    return colores[gravedad] || 'bg-gray-100 text-gray-700';
  };

  // Calcular desglose con IVA
  const calcularTotales = () => {
    if (!order) return null;
    
    const totalConIVA = order.budget || 0;
    const descuento = order.budget_discount || 0;
    
    const baseImponible = totalConIVA / (1 + IVA_PORCENTAJE / 100);
    const iva = totalConIVA - baseImponible;
    const subtotalConIVA = totalConIVA + descuento;
    
    return {
      totalConIVA,
      descuento,
      baseImponible,
      iva,
      subtotalConIVA
    };
  };

  const totales = calcularTotales();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
            <Gem className="w-8 h-8 text-primary-600 absolute top-6 left-1/2 transform -translate-x-1/2" />
          </div>
          <p className="text-gray-600 text-lg">Cargando presupuesto...</p>
          <p className="text-sm text-gray-400 mt-2">Por favor, espera un momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Enlace no válido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con estilo profesional y logo dinámico */}
        {/* Header con estilo profesional */}
<div className="bg-white rounded-t-2xl shadow-xl p-8 border-b border-gray-200">
  {/* Logo centrado arriba */}
  <div className="flex justify-center mb-6">
    {empresaConfig.logo_url ? (
      <img 
        src={empresaConfig.logo_url} 
        alt="Logo" 
        className="h-14 w-auto object-contain"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ) : (
      <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Gem className="w-8 h-8 text-white" />
      </div>
    )}
  </div>
  
  {/* Fila con título a izquierda y validez a derecha */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Presupuesto</h1>
      <p className="text-sm text-gray-500 flex items-center mt-1">
        <FileText className="w-4 h-4 mr-1" />
        Referencia: {order?.order_number || 'N/A'}
      </p>
    </div>
    <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl">
      <Clock className="w-5 h-5 text-gray-500" />
      <div>
        <p className="text-xs text-gray-500">Válido hasta</p>
        <p className="font-medium text-gray-800">
          {new Date(tokenInfo?.expires_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  </div>
</div>

        {/* Resto del contenido igual... */}
        {actionTaken ? (
          <div className="bg-white rounded-b-2xl shadow-xl p-12 text-center">
            <div className={`w-24 h-24 ${actionMessage.includes('aceptado') ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {actionMessage.includes('aceptado') ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {actionMessage.includes('aceptado') ? '¡Gracias por confiar en nosotros!' : 'Entendido'}
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{actionMessage}</p>
            <a 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-b-2xl shadow-xl p-8 space-y-6">
            {/* Resto del contenido sin cambios... */}
            
            {/* Información del cliente */}
            {client && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary-500" />
                  Tus datos
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{client.name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                      <span className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-1 text-gray-400" />
                        {client.phone}
                      </span>
                      {client.email && (
                        <span className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-1 text-gray-400" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información de la joya */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-primary-500" />
                Tu joya
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Tipo</p>
                  <p className="font-medium text-gray-800">{order.item_type}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Material</p>
                  <p className="font-medium text-gray-800">{order.material}</p>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Descripción</p>
                <p className="text-gray-700">{order.description}</p>
              </div>
            </div>

            {/* TRABAJOS NECESARIOS */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-primary-500" />
                Trabajos a realizar
              </h3>
              
              {order.trabajos && order.trabajos.length > 0 ? (
                <div className="space-y-3">
                  {order.trabajos.map((trabajo, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-200 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Wrench className="w-3 h-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{trabajo.nombre}</p>
                            {trabajo.cantidad > 1 && (
                              <p className="text-xs text-gray-500">Cantidad: {trabajo.cantidad}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 sm:space-x-6 pl-9 sm:pl-0">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Precio</p>
                            <p className="font-medium text-gray-800">{trabajo.tarifa_aplicada?.toFixed(2)}€</p>
                          </div>
                          {trabajo.descuento > 0 && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Dto.</p>
                              <p className="font-medium text-green-600">-{trabajo.descuento}%</p>
                            </div>
                          )}
                          {trabajo.cantidad > 1 && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Subtotal</p>
                              <p className="font-medium text-gray-800">{(trabajo.total || 0).toFixed(2)}€</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se han especificado trabajos</p>
                </div>
              )}
            </div>

            {/* FALLOS DETECTADOS */}
            {order.fallos && order.fallos.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Fallos detectados
                </h3>
                
                <div className="space-y-3">
                  {order.fallos.map((fallo, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 ${getGravedadColor(fallo.gravedad)} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <AlertTriangle className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{fallo.nombre}</p>
                            {fallo.observaciones && (
                              <p className="text-sm text-gray-500 mt-1">📝 {fallo.observaciones}</p>
                            )}
                          </div>
                        </div>
                        <div className="pl-9 sm:pl-0">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getGravedadColor(fallo.gravedad)}`}>
                            {fallo.gravedad?.charAt(0).toUpperCase() + fallo.gravedad?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TOTAL CON DESGLOSE DE IVA */}
            {totales && (
              <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-6 border-2 border-primary-200">
                <div className="space-y-3">
                  {totales.descuento > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{totales.subtotalConIVA.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Descuento</span>
                        <span>- {totales.descuento.toFixed(2)}€</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-primary-200">
                    <span className="text-gray-600">Base imponible</span>
                    <span className="font-medium">{totales.baseImponible.toFixed(2)}€</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Percent className="w-3 h-3 mr-1" />
                      IVA ({IVA_PORCENTAJE}%)
                    </span>
                    <span>{totales.iva.toFixed(2)}€</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t-2 border-primary-300 mt-2">
                    <span className="font-bold text-primary-800 text-lg">TOTAL (IVA incluido)</span>
                    <span className="text-2xl font-bold text-primary-600">{totales.totalConIVA.toFixed(2)}€</span>
                  </div>
                </div>
                
                {order.budget_notes && (
                  <div className="mt-4 pt-4 border-t border-primary-200">
                    <p className="text-sm text-gray-600 flex items-start">
                      <Shield className="w-4 h-4 mr-2 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>📋 {order.budget_notes}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => handleClientResponse('aceptado')}
                disabled={updating}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {updating ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ThumbsUp className="w-6 h-6" />
                    <span>Aceptar presupuesto</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleClientResponse('rechazado')}
                disabled={updating}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {updating ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ThumbsDown className="w-6 h-6" />
                    <span>Rechazar presupuesto</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              ⚡ Al aceptar, confirmas que estás de acuerdo con el presupuesto presentado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PresupuestoPublico;