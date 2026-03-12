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
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Loader
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
          ? 'Ya has aceptado este presupuesto' 
          : 'Ya has rechazado este presupuesto');
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
      console.log('Actualizando token...', tokenInfo.id);
      
      // 1. Actualizar el token
      const { error: tokenError } = await supabase
        .from('budget_tokens')
        .update({ 
          client_action: response,
          action_date: new Date().toISOString()
        })
        .eq('id', tokenInfo.id);

      if (tokenError) throw tokenError;

      console.log('Actualizando orden...', order.id);
      
      // 2. Actualizar la orden
      const { error: orderError } = await supabase
        .from('ordenes')
        .update({ 
          budget_status: response,
          status: response === 'aceptado' ? 'Aceptado' : 'Rechazado'
        })
        .eq('id', order.id);

      if (orderError) {
        console.error('Error detallado:', orderError);
        throw new Error(orderError.message);
      }

      setActionTaken(true);
      setActionMessage(response === 'aceptado' 
        ? '✅ ¡Presupuesto aceptado! En breve comenzaremos con la reparación.' 
        : '❌ Presupuesto rechazado. Puedes contactarnos si cambias de opinión.');

    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al procesar tu respuesta: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-block btn-primary"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-sm p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gem className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-800">Presupuesto</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Válido hasta: {new Date(tokenInfo?.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {actionTaken ? (
          <div className="bg-white rounded-b-xl shadow-sm p-12 text-center">
            {actionMessage.includes('aceptado') ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {actionMessage.includes('aceptado') ? '¡Gracias!' : 'Entendido'}
            </h2>
            <p className="text-gray-600 mb-8">{actionMessage}</p>
          </div>
        ) : (
          <div className="bg-white rounded-b-xl shadow-sm p-6 space-y-6">
            
            {client && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">Tus datos</h3>
                <p className="font-medium text-gray-900">{client.name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
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
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">Tu joya</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="font-medium">{order.item_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Material</p>
                  <p className="font-medium">{order.material}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500">Descripción</p>
                <p className="text-sm text-gray-700">{order.description}</p>
              </div>
            </div>

            {order.diagnosis && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">Trabajo necesario</h3>
                
                {order.diagnosis.works?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Trabajos:</p>
                    <ul className="list-disc list-inside text-sm">
                      {order.diagnosis.works.map((work, i) => (
                        <li key={i}>{work.description} ({work.estimatedHours}h)</li>
                      ))}
                    </ul>
                  </div>
                )}

                {order.diagnosis.materials?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Materiales:</p>
                    <ul className="list-disc list-inside text-sm">
                      {order.diagnosis.materials.map((mat, i) => (
                        <li key={i}>{mat.name} x{mat.quantity} - {mat.price}€</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="bg-primary-50 rounded-lg p-6 border-2 border-primary-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Total presupuesto</h3>
                <span className="text-3xl font-bold text-primary-600">
                  {order.budget}€
                </span>
              </div>
              
              {order.budget_notes && (
                <p className="text-sm text-gray-600 border-t border-primary-200 pt-4">
                  📋 {order.budget_notes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => handleClientResponse('aceptado')}
                disabled={updating}
                className="bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ThumbsUp className="w-6 h-6" />
                    <span>Aceptar</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleClientResponse('rechazado')}
                disabled={updating}
                className="bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ThumbsDown className="w-6 h-6" />
                    <span>Rechazar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PresupuestoPublico;