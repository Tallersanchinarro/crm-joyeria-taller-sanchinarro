import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

function AdminFallos() {
  const navigate = useNavigate();
  const [fallos, setFallos] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Estado para nuevo fallo
  const [nuevoFallo, setNuevoFallo] = useState({ 
    familia_id: '', 
    nombre: '', 
    descripcion: '',
    gravedad: 'media'
  });
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // ✅ CORREGIDO: Cargar familias de FALLOS
      const { data: familiasData, error: familiasError } = await supabase
        .from('familias_fallos')  // ← Cambiado de 'familias_trabajos' a 'familias_fallos'
        .select('*')
        .order('nombre');

      if (familiasError) throw familiasError;
      setFamilias(familiasData || []);

      // Cargar fallos
      const { data: fallosData, error: fallosError } = await supabase
        .from('fallos_predefinidos')
        .select('*, familias_fallos(nombre)')  // ← Cambiado a 'familias_fallos'
        .order('nombre');

      if (fallosError && fallosError.code === '42P01') {
        await crearTablaFallos();
        setFallos([]);
      } else if (fallosError) {
        throw fallosError;
      } else {
        setFallos(fallosData || []);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearTablaFallos = async () => {
    // Crear tabla de fallos si no existe
    const { error } = await supabase.rpc('crear_tabla_fallos', {});
    if (error) {
      console.error('Error creando tabla:', error);
      alert('Ejecuta este SQL en Supabase:\n\n' +
        'CREATE TABLE fallos_predefinidos (\n' +
        '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n' +
        '  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n' +
        '  familia_id UUID REFERENCES familias_fallos(id) ON DELETE CASCADE,\n' + // ← Cambiado
        '  nombre TEXT NOT NULL,\n' +
        '  descripcion TEXT,\n' +
        '  gravedad TEXT DEFAULT \'media\',\n' +
        '  activo BOOLEAN DEFAULT true\n' +
        ');'
      );
    }
  };

  const crearFallo = async () => {
    if (!nuevoFallo.nombre || !nuevoFallo.familia_id) {
      setError('Nombre y familia son obligatorios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fallos_predefinidos')
        .insert([{ 
          familia_id: nuevoFallo.familia_id,
          nombre: nuevoFallo.nombre,
          descripcion: nuevoFallo.descripcion || '',
          gravedad: nuevoFallo.gravedad
        }])
        .select('*, familias_fallos(nombre)')  // ← Cambiado
        .single();

      if (error) throw error;

      setFallos([...fallos, data]);
      setNuevoFallo({ familia_id: '', nombre: '', descripcion: '', gravedad: 'media' });
      setMostrarForm(false);
      setSuccessMessage('Fallo creado correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error creando fallo:', error);
      setError(error.message);
    }
  };

  const actualizarFallo = async (id, datos) => {
    try {
      const { data, error } = await supabase
        .from('fallos_predefinidos')
        .update(datos)
        .eq('id', id)
        .select('*, familias_fallos(nombre)')  // ← Cambiado
        .single();

      if (error) throw error;

      setFallos(fallos.map(f => f.id === id ? data : f));
      setEditandoId(null);
      setSuccessMessage('Fallo actualizado');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error actualizando fallo:', error);
      setError(error.message);
    }
  };

  const eliminarFallo = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este fallo?')) return;

    try {
      const { error } = await supabase
        .from('fallos_predefinidos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFallos(fallos.filter(f => f.id !== id));
      setSuccessMessage('Fallo eliminado');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error eliminando fallo:', error);
      setError(error.message);
    }
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

  // Filtrar fallos por búsqueda
  const filteredFallos = fallos.filter(fallo =>
    fallo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fallo.descripcion && fallo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (fallo.familias_fallos?.nombre && fallo.familias_fallos.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Mensajes de éxito/error */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Catálogo de Fallos</h1>
            <p className="text-sm text-gray-500">
              Gestiona los fallos comunes en reparaciones
            </p>
          </div>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo fallo</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar fallos por nombre, descripción o familia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Formulario nuevo fallo */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-primary-200">
          <h3 className="font-medium text-gray-800 mb-4">Nuevo fallo</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Familia
              </label>
              <select
                value={nuevoFallo.familia_id}
                onChange={(e) => setNuevoFallo({...nuevoFallo, familia_id: e.target.value})}
                className="input-field"
              >
                <option value="">Seleccionar familia</option>
                {familias.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del fallo
              </label>
              <input
                type="text"
                value={nuevoFallo.nombre}
                onChange={(e) => setNuevoFallo({...nuevoFallo, nombre: e.target.value})}
                className="input-field"
                placeholder="Ej: Piedra floja"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={nuevoFallo.descripcion}
                onChange={(e) => setNuevoFallo({...nuevoFallo, descripcion: e.target.value})}
                className="input-field"
                placeholder="Descripción detallada del fallo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gravedad
              </label>
              <select
                value={nuevoFallo.gravedad}
                onChange={(e) => setNuevoFallo({...nuevoFallo, gravedad: e.target.value})}
                className="input-field"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setMostrarForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={crearFallo}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar fallo</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de fallos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredFallos.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay fallos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Familia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fallo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gravedad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFallos.map((fallo) => (
                  <tr key={fallo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {fallo.familias_fallos?.nombre || 'Sin familia'}  {/* ← Cambiado */}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editandoId === fallo.id ? (
                        <input
                          type="text"
                          defaultValue={fallo.nombre}
                          className="input-field text-sm py-1"
                          id={`nombre-${fallo.id}`}
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{fallo.nombre}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editandoId === fallo.id ? (
                        <input
                          type="text"
                          defaultValue={fallo.descripcion || ''}
                          className="input-field text-sm py-1"
                          id={`desc-${fallo.id}`}
                        />
                      ) : (
                        <span className="text-sm text-gray-500">{fallo.descripcion}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editandoId === fallo.id ? (
                        <select
                          defaultValue={fallo.gravedad}
                          className="input-field text-sm py-1"
                          id={`gravedad-${fallo.id}`}
                        >
                          <option value="baja">Baja</option>
                          <option value="media">Media</option>
                          <option value="alta">Alta</option>
                          <option value="critica">Crítica</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${getGravedadColor(fallo.gravedad)}`}>
                          {fallo.gravedad}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editandoId === fallo.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const nombre = document.getElementById(`nombre-${fallo.id}`).value;
                              const desc = document.getElementById(`desc-${fallo.id}`).value;
                              const gravedad = document.getElementById(`gravedad-${fallo.id}`).value;
                              actualizarFallo(fallo.id, { nombre, descripcion: desc, gravedad });
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditandoId(fallo.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => eliminarFallo(fallo.id)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default AdminFallos;