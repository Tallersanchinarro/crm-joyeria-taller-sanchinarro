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
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateReceptionPDF } from '../utils/pdfGenerator';

// Lista de tipos de joyas
const tiposJoya = [
  'Anillo',
  'Collar',
  'Pendientes',
  'Pulsera',
  'Reloj',
  'Medalla/Religiosa',
  'Broche',
  'Cadenas',
  'Gargantilla',
  'Diadema',
  'Juego completo',
  'Otro'
];

// Lista de materiales
const tiposMaterial = [
  'Oro amarillo 18k',
  'Oro blanco 18k',
  'Oro rosa 18k',
  'Oro 14k',
  'Oro 9k',
  'Oro 24k',
  'Plata 925',
  'Plata ley',
  'Acero inoxidable',
  'Titanio',
  'Bronce',
  'Cobre',
  'Latón',
  'Rodio',
  'Paladio',
  'Platino',
  'Acero quirúrgico',
  'Madera',
  'Resina',
  'Cuero',
  'Otro'
];

function NuevaRecepcion() {
  const navigate = useNavigate();
  const { createClient, createOrder } = useApp();
  const [step, setStep] = useState(1); // 1: Cliente, 2: Joya, 3: Resguardo
  const [cliente, setCliente] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [recepcion, setRecepcion] = useState({
    itemType: '',
    material: '',
    description: '',
    observations: '',
    photos: []
  });
  const [fotos, setFotos] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nuevaOrden, setNuevaOrden] = useState(null);

  // Generar número de recepción
  const generarNumeroRecepcion = () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `R-${año}${mes}${dia}-${random}`;
  };

  // Guardar recepción y generar orden
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

    // Crear orden en estado "Recibido"
    const orderNumber = generarNumeroRecepcion();
    const newOrder = createOrder({
      orderNumber,
      clientId,
      clientName: cliente.name,
      clientPhone: cliente.phone,
      clientEmail: cliente.email,
      itemType: recepcion.itemType,
      material: recepcion.material,
      description: recepcion.description,
      observations: recepcion.observations,
      status: 'Recibido',
      budget: null,
      budgetStatus: 'pendiente',
      createdAt: new Date().toISOString(),
      estimatedDate: null,
      photos: fotos,
      diagnosis: null,
      requiredWorks: [],
      materials: []
    });

    setNuevaOrden(newOrder);
    setStep(3); // Ir al paso de resguardo
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Generar PDF para el cliente
  const handlePrintClientPDF = () => {
    if (nuevaOrden && cliente) {
      generateReceptionPDF(nuevaOrden, cliente, 'cliente');
    }
  };

  // Generar PDF para el taller
  const handlePrintWorkshopPDF = () => {
    if (nuevaOrden && cliente) {
      generateReceptionPDF(nuevaOrden, cliente, 'taller');
    }
  };

  // Imprimir ambos
  const handlePrintBoth = () => {
    handlePrintClientPDF();
    setTimeout(() => {
      handlePrintWorkshopPDF();
    }, 1000);
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
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className={`text-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-sm font-medium">1. Cliente</span>
          </div>
          <div className={`text-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-sm font-medium">2. Joya</span>
          </div>
          <div className={`text-center ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="text-sm font-medium">3. Resguardo</span>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>✅ Recepción guardada</span>
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
            {/* Tipo de joya */}
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
                {tiposJoya.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Material */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material principal *
              </label>
              <select
                value={recepcion.material}
                onChange={(e) => setRecepcion({...recepcion, material: e.target.value})}
                className="input-field"
              >
                <option value="">Seleccionar material</option>
                {tiposMaterial.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del problema *
              </label>
              <textarea
                value={recepcion.description}
                onChange={(e) => setRecepcion({...recepcion, description: e.target.value})}
                rows="4"
                className="input-field"
                placeholder="Ej: La piedra está floja, el cierre no cierra bien..."
              />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={recepcion.observations}
                onChange={(e) => setRecepcion({...recepcion, observations: e.target.value})}
                rows="2"
                className="input-field"
                placeholder="Notas para el joyero..."
              />
            </div>

            {/* Fotos */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos (opcional)
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
                        <img 
                          src={foto} 
                          alt={`Foto ${index + 1}`} 
                          className="w-full h-16 object-cover rounded-lg"
                        />
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
              <p className="text-sm font-medium text-blue-800">Proceso</p>
              <p className="text-xs text-blue-700">
                La joya queda registrada para análisis. Al finalizar, podrás imprimir el resguardo.
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
              disabled={!recepcion.itemType || !recepcion.material || !recepcion.description}
              className="btn-primary px-6 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar y continuar</span>
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Resguardo */}
      {step === 3 && nuevaOrden && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">¡Recepción completada!</h2>
            <p className="text-gray-500">Nº de orden: {nuevaOrden.orderNumber}</p>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Cliente:</span> {cliente.name}</p>
              <p><span className="text-gray-500">Teléfono:</span> {cliente.phone}</p>
              <p><span className="text-gray-500">Joya:</span> {recepcion.itemType} · {recepcion.material}</p>
              <p><span className="text-gray-500">Problema:</span> {recepcion.description}</p>
              <p><span className="text-gray-500">Fecha:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Opciones de impresión */}
          <div className="space-y-3">
            <button
              onClick={handlePrintClientPDF}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimir resguardo para el cliente</span>
            </button>

            <button
              onClick={handlePrintWorkshopPDF}
              className="w-full btn-secondary flex items-center justify-center space-x-2 py-3"
            >
              <Copy className="w-5 h-5" />
              <span>Imprimir copia para el taller</span>
            </button>

            <button
              onClick={handlePrintBoth}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Imprimir ambos</span>
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => {
                setStep(1);
                setCliente({ id: '', name: '', phone: '', email: '', address: '' });
                setRecepcion({ itemType: '', material: '', description: '', observations: '', photos: [] });
                setFotos([]);
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