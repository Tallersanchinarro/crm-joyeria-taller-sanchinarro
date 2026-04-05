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
  Building,
  MapPin
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
  const [empresaConfig, setEmpresaConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  const IVA_PORCENTAJE = 21;

  // Cargar configuración de la empresa desde Supabase
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data: config, error } = await supabase
          .from('configuracion')
          .select('*')
          .single();

        if (!error && config) {
          const empresa = config.empresa || {};
          const direccionCompleta = `${empresa.direccion || ''}${empresa.cp ? `, ${empresa.cp}` : ''}`;
          
          setEmpresaConfig({
            nombre: empresa.nombre || 'LAM-RELOJEROS S.L',
            logo_url: config.logo_url || null,
            telefono: empresa.telefono || '672373275',
            email: empresa.email || 'tallersanchinarro@rubiorelojeros.com',
            direccionCompleta: direccionCompleta,
            ciudad: empresa.ciudad || 'Madrid',
            cif: empresa.cif || 'B-88615489'
          });
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (token) {
      loadBudgetData();
    }
  }, [token]);

  const loadBudgetData = async () => {
    try {
      // ============================================
      // PASO 1: Establecer el token en Supabase
      // ============================================
      try {
        await supabase.rpc('set_app_current_token', { token_value: token });
      } catch (rpcError) {
        console.warn('RPC falló, intentando método alternativo:', rpcError);
        // Fallback para versión anterior de Supabase
        await supabase.query(`SET app.current_token = '${token}'`);
      }

      // ============================================
      // PASO 2: Verificar token
      // ============================================
      const { data: tokenData, error: tokenError } = await supabase
        .from('budget_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (tokenError || !tokenData) {
        throw new Error('Enlace no válido');
      }

      // Verificar expiración
      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error('Este enlace ha expirado (válido 7 días)');
      }

      setTokenInfo(tokenData);

      // ============================================
      // PASO 3: Registrar visualización (sin IP por privacidad)
      // ============================================
      await supabase
        .from('budget_tokens')
        .update({ 
          viewed_at: new Date().toISOString(),
          user_agent: navigator.userAgent.substring(0, 255)
        })
        .eq('id', tokenData.id);

      // ============================================
      // PASO 4: Cargar la orden (las políticas RLS la filtran)
      // ============================================
      const { data: orderData, error: orderError } = await supabase
        .from('ordenes')
        .select('*')
        .eq('id', tokenData.order_id)
        .maybeSingle();

      if (orderError || !orderData) {
        throw new Error('Error al cargar el presupuesto');
      }
      setOrder(orderData);

      // ============================================
      // PASO 5: Cargar el cliente (las políticas RLS lo filtran)
      // ============================================
      const { data: clientData, error: clientError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', orderData.client_id)
        .maybeSingle();

      if (!clientError && clientData) {
        setClient(clientData);
      }

      // ============================================
      // PASO 6: Verificar si ya se tomó una acción
      // ============================================
      if (tokenData.client_action) {
        setActionTaken(true);
        setActionMessage(tokenData.client_action === 'aceptado' 
          ? '✅ Ya has aceptado este presupuesto. Gracias por confiar en nuestro taller.' 
          : '❌ Ya has rechazado este presupuesto. Si cambias de opinión, contáctanos.');
      }

    } catch (error) {
      console.error('Error loading budget:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientResponse = async (response) => {
    if (actionTaken || updating) return;

    setUpdating(true);

    try {
      // Asegurar que el token sigue establecido
      await supabase.rpc('set_app_current_token', { token_value: token });

      // Actualizar token
      const { error: tokenError } = await supabase
        .from('budget_tokens')
        .update({ 
          client_action: response,
          action_date: new Date().toISOString()
        })
        .eq('id', tokenInfo.id);

      if (tokenError) throw tokenError;

      // Actualizar orden
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

  if (loading || configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-gray-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Enlace no válido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con logo y datos de empresa */}
        <div className="bg-white rounded-t-2xl shadow-xl p-8 border-b border-gray-200">
          <div className="flex justify-center mb-6">
            {empresaConfig?.logo_url ? (
              <img 
                src={empresaConfig.logo_url} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Gem className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          <div className="text-center mb-6">
            <br></br>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {empresaConfig?.direccionCompleta || 'C/ Ejemplo, 123'}
              </span>
              <span className="flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                {empresaConfig?.telefono || '672373275'}
              </span>
              <span className="flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                {empresaConfig?.email || 'info@lam-relojeros.com'}
              </span>
              <span className="flex items-center">
                <Building className="w-3 h-3 mr-1" />
                {empresaConfig?.cif || 'B-88615489'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Presupuesto</h1>
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
                  {tokenInfo?.expires_at ? new Date(tokenInfo.expires_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : 'No disponible'}
                </p>
              </div>
            </div>
          </div>
        </div>

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
           
          </div>
        ) : (
          <div className="bg-white rounded-b-2xl shadow-xl p-8 space-y-6">
            
            {/* Información del cliente */}
            {client && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gray-600" />
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
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-gray-600" />
                Tu joya
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Tipo</p>
                  <p className="font-medium text-gray-800">{order?.item_type || 'No especificado'}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Material</p>
                  <p className="font-medium text-gray-800">{order?.material || 'No especificado'}</p>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Descripción</p>
                <p className="text-gray-700">{order?.description || 'Sin descripción'}</p>
              </div>
            </div>

            {/* Fallos detectados */}
            {order?.fallos && order.fallos.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-gray-600" />
                  Fallos detectados
                </h3>
                <div className="space-y-3">
                  {order.fallos.map((fallo, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{fallo.nombre}</p>
                            {fallo.observaciones && (
                              <p className="text-sm text-gray-500 mt-1">📝 {fallo.observaciones}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trabajos a realizar */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-gray-600" />
                Trabajos a realizar
              </h3>
              
              {order?.trabajos && order.trabajos.length > 0 ? (
                <div className="space-y-3">
                  {order.trabajos.map((trabajo, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Wrench className="w-3 h-3 text-gray-600" />
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

            {/* Totales */}
            {totales && (
              <div className="bg-gray-100 rounded-xl p-6 border border-gray-300">
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
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
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
                  
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-400 mt-2">
                    <span className="font-bold text-gray-800 text-lg">TOTAL (IVA incluido)</span>
                    <span className="text-2xl font-bold text-gray-900">{totales.totalConIVA.toFixed(2)}€</span>
                  </div>
                </div>
                
                {order?.budget_notes && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-sm text-gray-600 flex items-start">
                      <Shield className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
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
                className="bg-gray-800 text-white py-4 rounded-xl hover:bg-gray-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                className="bg-gray-600 text-white py-4 rounded-xl hover:bg-gray-500 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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