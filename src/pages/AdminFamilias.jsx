import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FolderTree,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

function AdminFamilias() {
  const navigate = useNavigate();
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Estado para nueva familia
  const [nuevaFamilia, setNuevaFamilia] = useState({ nombre: '', orden: 0 });
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    cargarFamilias();
  }, []);

  const cargarFamilias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('familias_trabajos')
        .select('*')
        .order('orden');

      if (error) throw error;
      setFamilias(data || []);
    } catch (error) {
      console.error('Error cargando familias:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearFamilia = async () => {
    if (!nuevaFamilia.nombre) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('familias_trabajos')
        .insert([{ 
          nombre: nuevaFamilia.nombre, 
          orden: nuevaFamilia.orden || 0 
        }])
        .select()
        .single();

      if (error) throw error;

      setFamilias([...familias, data].sort((a, b) => a.orden - b.orden));
      setNuevaFamilia({ nombre: '', orden: 0 });
      setMostrarForm(false);
      setSuccessMessage('Familia creada correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error creando familia:', error);
      setError(error.message);
    }
  };

  const actualizarFamilia = async (id, datos) => {
    try {
      const { data, error } = await supabase
        .from('familias_trabajos')
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFamilias(familias.map(f => f.id === id ? data : f).sort((a, b) => a.orden - b.orden));
      setEditandoId(null);
      setSuccessMessage('Familia actualizada');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error actualizando familia:', error);
      setError(error.message);
    }
  };

  const eliminarFamilia = async (id) => {
    // Verificar si tiene trabajos asociados
    const { data: trabajos, error: checkError } = await supabase
      .from('trabajos_predefinidos')
      .select('id')
      .eq('familia_id', id)
      .limit(1);

    if (checkError) {
      setError('Error al verificar trabajos asociados');
      return;
    }

    if (trabajos && trabajos.length > 0) {
      setError('No se puede eliminar una familia con trabajos asociados');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar esta familia?')) return;

    try {
      const { error } = await supabase
        .from('familias_trabajos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFamilias(familias.filter(f => f.id !== id));
      setSuccessMessage('Familia eliminada');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error eliminando familia:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-800">Familias de Trabajos</h1>
            <p className="text-sm text-gray-500">
              Gestiona las categorías de trabajos para reparaciones
            </p>
          </div>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva familia</span>
        </button>
      </div>

      {/* Formulario nueva familia */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-primary-200">
          <h3 className="font-medium text-gray-800 mb-4">Nueva familia</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={nuevaFamilia.nombre}
                onChange={(e) => setNuevaFamilia({...nuevaFamilia, nombre: e.target.value})}
                className="input-field"
                placeholder="Ej: Anillos, Engarces..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden
              </label>
              <input
                type="number"
                value={nuevaFamilia.orden}
                onChange={(e) => setNuevaFamilia({...nuevaFamilia, orden: parseInt(e.target.value) || 0})}
                className="input-field"
                placeholder="0"
              />
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
              onClick={crearFamilia}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar familia</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de familias */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {familias.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center">
                  <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay familias creadas</p>
                </td>
              </tr>
            ) : (
              familias.map((familia) => (
                <tr key={familia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editandoId === familia.id ? (
                      <input
                        type="number"
                        defaultValue={familia.orden}
                        className="input-field text-sm py-1 w-20"
                        id={`orden-${familia.id}`}
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{familia.orden}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editandoId === familia.id ? (
                      <input
                        type="text"
                        defaultValue={familia.nombre}
                        className="input-field text-sm py-1"
                        id={`nombre-${familia.id}`}
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{familia.nombre}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editandoId === familia.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const nombre = document.getElementById(`nombre-${familia.id}`).value;
                            const orden = parseInt(document.getElementById(`orden-${familia.id}`).value) || 0;
                            actualizarFamilia(familia.id, { nombre, orden });
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Guardar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditandoId(familia.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => eliminarFamilia(familia.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

export default AdminFamilias;