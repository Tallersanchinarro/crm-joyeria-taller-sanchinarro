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
  FileText,
  Calendar,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function NuevaRecepcion() {
  const navigate = useNavigate();
  const { createClient, createOrder } = useApp();
  const [step, setStep] = useState(1); // 1: Cliente, 2: Joya
  const [cliente, setCliente] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [recepcion, setRecepcion] = useState({
    item: '',
    itemType: '',
    material: '',
    description: '',
    observations: '',
    priority: 'Normal',
    estimatedDays: 7,
    photos: []
  });
  const [fotos, setFotos] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Generar número de recepción
  const generarNumeroRecepcion = () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `R-${año}${mes}${dia}-${random}`;
  };

  // Guardar recepción (sin presupuesto)
  const handleGuardarRecepcion = () => {
    // Crear o actualizar cliente
    let clientId = cliente.id;
    if (!clientId) {
      const newClient = createClient({
        name: cliente.name,
        phone: cliente.phone,
        email: cliente.email,
        address: cliente.address,
        createdAt: new Date().toISOString()
      });
      clientId = newClient.id;
    }

    // Crear orden en estado "Recibido" (sin presupuesto)
    const orderNumber = generarNumeroRecepcion();
    const newOrder = createOrder({
      orderNumber,
      clientId,
      clientName: cliente.name,
      clientPhone: cliente.phone,
      clientEmail: cliente.email,
      item: recepcion.item,
      itemType: recepcion.itemType,
      material: recepcion.material,
      description: recepcion.description,
      observations: recepcion.observations,
      priority: recepcion.priority,
      status: 'Recibido',
      budget: null, // Sin presupuesto aún
      budgetStatus: 'pendiente', // pendiente, aceptado, rechazado
      createdAt: new Date().toISOString(),
      estimatedDate: new Date(Date.now() + recepcion.estimatedDays * 24 * 60 * 60 * 1000).toISOString(),
      photos: fotos,
      diagnosis: null, // Se llenará después en el análisis
      requiredWorks: [], // Trabajos necesarios
      materials: [] // Materiales necesarios
    });

    setShowSuccess(true);
    setTimeout(() => {
      navigate(`/reparacion/${newOrder.id}`); // Ir a la página de detalle
    }, 2000);
  };

  // Simular subida de fotos
  const handleFotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const nuevasFotos = files.map(file => URL.createObjectURL(file));
    setFotos([...fotos, ...nuevasFotos]);
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
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className={`text-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-sm font-medium">1. Datos del Cliente</span>
          </div>
          <div className={`text-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-sm font-medium">2. Datos de la Joya</span>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>✅ Recepción guardada. Redirigiendo...</span>
          </div>
        </div>
      )}

      {/* PASO 1: Datos del Cliente */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary-500" />
            Datos del Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                value={cliente.name}
                onChange={(e) => setCliente({...cliente, name: e.target.value})}
                className="input-field"
                placeholder="Ej: María García López"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                value={cliente.phone}
                onChange={(e) => setCliente({...cliente, phone: e.target.value})}
                className="input-field"
                placeholder="+34 612 345 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (opcional)
              </label>
              <input
                type="email"
                value={cliente.email}
                onChange={(e) => setCliente({...cliente, email: e.target.value})}
                className="input-field"
                placeholder="cliente@email.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección (opcional)
              </label>
              <input
                type="text"
                value={cliente.address}
                onChange={(e) => setCliente({...cliente, address: e.target.value})}
                className="input-field"
                placeholder="Calle, ciudad..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
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

      {/* PASO 2: Datos de la Joya */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Gem className="w-5 h-5 mr-2 text-primary-500" />
            Datos de la Joya
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de joya *
              </label>
              <select
                value={recepcion.itemType}
                onChange={(e) => setRecepcion({...recepcion, itemType: e.target.value})}
                className="input-field"
              >
                <option value="">Seleccionar tipo</option>
                <option value="Anillo">Anillo</option>
                <option value="Collar">Collar</option>
                <option value="Pendientes">Pendientes</option>
                <option value="Pulsera">Pulsera</option>
                <option value="Reloj">Reloj</option>
                <option value="Medalla">Medalla/Religiosa</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la joya *
              </label>
              <input
                type="text"
                value={recepcion.item}
                onChange={(e) => setRecepcion({...recepcion, item: e.target.value})}
                className="input-field"
                placeholder="Ej: Anillo de compromiso con diamante central"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <input
                type="text"
                value={recepcion.material}
                onChange={(e) => setRecepcion({...recepcion, material: e.target.value})}
                className="input-field"
                placeholder="Ej: Oro 18k, Plata..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días estimados
              </label>
              <input
                type="number"
                value={recepcion.estimatedDays}
                onChange={(e) => setRecepcion({...recepcion, estimatedDays: parseInt(e.target.value)})}
                min="1"
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la visita / Problema a revisar *
              </label>
              <textarea
                value={recepcion.description}
                onChange={(e) => setRecepcion({...recepcion, description: e.target.value})}
                rows="3"
                className="input-field"
                placeholder="Ej: La piedra está floja, el cierre no cierra bien, necesita limpieza..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones adicionales
              </label>
              <textarea
                value={recepcion.observations}
                onChange={(e) => setRecepcion({...recepcion, observations: e.target.value})}
                rows="2"
                className="input-field"
                placeholder="Notas importantes para el joyero..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos de la joya (opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFotoUpload}
                  className="hidden"
                  id="foto-upload"
                />
                <label
                  htmlFor="foto-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Haz clic para subir fotos</p>
                </label>
                
                {fotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {fotos.map((foto, index) => (
                      <div key={index} className="relative">
                        <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-16 object-cover rounded-lg" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Proceso de presupuesto</p>
              <p className="text-xs text-blue-700">
                La joya queda registrada para análisis. El joyero examinará la pieza y 
                generará un presupuesto más tarde. No se cobra nada en este momento.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Atrás
            </button>
            <button
              onClick={handleGuardarRecepcion}
              disabled={!recepcion.item || !recepcion.description}
              className="btn-primary px-6 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar recepción</span>
            </button>
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

export default NuevaRecepcion;