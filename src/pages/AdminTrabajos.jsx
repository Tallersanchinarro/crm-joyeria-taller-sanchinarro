import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

function AdminTrabajos() {
  const navigate = useNavigate();
  const [familias, setFamilias] = useState([]);
  const [trabajos, setTrabajos] = useState({});
  const [loading, setLoading] = useState(true);
  const [familiasAbiertas, setFamiliasAbiertas] = useState({});
  const [editandoFamilia, setEditandoFamilia] = useState(null);
  const [editandoTrabajo, setEditandoTrabajo] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Estados para nuevo trabajo/familia
  const [nuevaFamilia, setNuevaFamilia] = useState({ nombre: '', orden: 0 });
  const [mostrarFormFamilia, setMostrarFormFamilia] = useState(false);
  const [nuevoTrabajo, setNuevoTrabajo] = useState({ 
    familia_id: '', 
    nombre: '', 
    tarifa_base: 0,
    descripcion: '' 
  });
  const [mostrarFormTrabajo, setMostrarFormTrabajo] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar familias
      const { data: familiasData, error: familiasError } = await supabase
        .from('familias_trabajos')
        .select('*')
        .order('orden');

      if (familiasError) throw familiasError;
      setFamilias(familiasData || []);

      // Cargar trabajos
      const { data: trabajosData, error: trabajosError } = await supabase
        .from('trabajos_predefinidos')
        .select('*')
        .order('nombre');

      if (trabajosError) throw trabajosError;

      // Agrupar trabajos por familia
      const trabajosPorFamilia = {};
      trabajosData?.forEach(t => {
        if (!trabajosPorFamilia[t.familia_id]) {
          trabajosPorFamilia[t.familia_id] = [];
        }
        trabajosPorFamilia[t.familia_id].push(t);
      });
      setTrabajos(trabajosPorFamilia);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFamilia = (familiaId) => {
    setFamiliasAbiertas(prev => ({
      ...prev,
      [familiaId]: !prev[familiaId]
    }));
  };

  // ===== CRUD FAMILIAS =====
  const crearFamilia = async () => {
    if (!nuevaFamilia.nombre) {
      setError('El nombre de la familia es obligatorio');
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

      setFamilias([...familias, data]);
      setNuevaFamilia({ nombre: '', orden: 0 });
      setMostrarFormFamilia(false);
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

      setFamilias(familias.map(f => f.id === id ? data : f));
      setEditandoFamilia(null);
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
    if (trabajos[id]?.length > 0) {
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

  // ===== CRUD TRABAJOS =====
  const crearTrabajo = async () => {
    if (!nuevoTrabajo.nombre || !nuevoTrabajo.familia_id) {
      setError('Nombre y familia son obligatorios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trabajos_predefinidos')
        .insert([{ 
          familia_id: nuevoTrabajo.familia_id,
          nombre: nuevoTrabajo.nombre,
          tarifa_base: nuevoTrabajo.tarifa_base || 0,
          descripcion: nuevoTrabajo.descripcion || '',
          activo: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Actualizar el estado agrupado
      setTrabajos(prev => ({
        ...prev,
        [data.familia_id]: [...(prev[data.familia_id] || []), data]
      }));

      setNuevoTrabajo({ familia_id: '', nombre: '', tarifa_base: 0, descripcion: '' });
      setMostrarFormTrabajo(false);
      setSuccessMessage('Trabajo creado correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error creando trabajo:', error);
      setError(error.message);
    }
  };

  const actualizarTrabajo = async (id, datos) => {
    try {
      const { data, error } = await supabase
        .from('trabajos_predefinidos')
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar en el estado agrupado
      setTrabajos(prev => {
        const nuevosTrabajos = { ...prev };
        // Quitar de la familia anterior si cambió
        if (datos.familia_id && datos.familia_id !== data.familia_id) {
          // Esto requeriría más lógica, por simplicidad, recargamos
          cargarDatos();
          return prev;
        }
        
        // Actualizar en su familia actual
        const familiaTrabajos = nuevosTrabajos[data.familia_id] || [];
        nuevosTrabajos[data.familia_id] = familiaTrabajos.map(t => 
          t.id === id ? data : t
        );
        return nuevosTrabajos;
      });

      setEditandoTrabajo(null);
      setSuccessMessage('Trabajo actualizado');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error actualizando trabajo:', error);
      setError(error.message);
    }
  };

  const eliminarTrabajo = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este trabajo?')) return;

    try {
      const { error } = await supabase
        .from('trabajos_predefinidos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recargar datos para actualizar el estado
      cargarDatos();
      setSuccessMessage('Trabajo eliminado');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error eliminando trabajo:', error);
      setError(error.message);
    }
  };

  const toggleActivo = async (trabajo) => {
    await actualizarTrabajo(trabajo.id, { activo: !trabajo.activo });
  };

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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Catálogo de Trabajos</h1>
          <p className="text-sm text-gray-500">
            Gestiona las familias y trabajos predefinidos para reparaciones
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
        >
          Volver al dashboard
        </button>
      </div>

      {/* Botones de acción principales */}
      <div className="flex space-x-3">
        <button
          onClick={() => setMostrarFormFamilia(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nueva familia</span>
        </button>
        <button
          onClick={() => setMostrarFormTrabajo(true)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo trabajo</span>
        </button>
      </div>

      {/* Formulario nueva familia */}
      {mostrarFormFamilia && (
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
              onClick={() => setMostrarFormFamilia(false)}
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

      {/* Formulario nuevo trabajo */}
      {mostrarFormTrabajo && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-primary-200">
          <h3 className="font-medium text-gray-800 mb-4">Nuevo trabajo</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Familia
              </label>
              <select
                value={nuevoTrabajo.familia_id}
                onChange={(e) => setNuevoTrabajo({...nuevoTrabajo, familia_id: e.target.value})}
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
                Nombre del trabajo
              </label>
              <input
                type="text"
                value={nuevoTrabajo.nombre}
                onChange={(e) => setNuevoTrabajo({...nuevoTrabajo, nombre: e.target.value})}
                className="input-field"
                placeholder="Ej: Reengarzar piedra"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa base (€)
              </label>
              <input
                type="number"
                value={nuevoTrabajo.tarifa_base}
                onChange={(e) => setNuevoTrabajo({...nuevoTrabajo, tarifa_base: parseFloat(e.target.value) || 0})}
                className="input-field"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={nuevoTrabajo.descripcion}
                onChange={(e) => setNuevoTrabajo({...nuevoTrabajo, descripcion: e.target.value})}
                className="input-field"
                placeholder="Breve descripción"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setMostrarFormTrabajo(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={crearTrabajo}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar trabajo</span>
            </button>
          </div>
        </div>
      )}

      {/* Listado de familias y trabajos */}
      <div className="space-y-4">
        {familias.map(familia => (
          <div key={familia.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Cabecera de familia */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b">
              <div className="flex items-center space-x-4 flex-1">
                <button
                  onClick={() => toggleFamilia(familia.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {familiasAbiertas[familia.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {editandoFamilia === familia.id ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      defaultValue={familia.nombre}
                      className="input-field text-sm py-1"
                      id={`nombre-${familia.id}`}
                    />
                    <input
                      type="number"
                      defaultValue={familia.orden}
                      className="input-field text-sm py-1 w-20"
                      id={`orden-${familia.id}`}
                    />
                    <button
                      onClick={() => {
                        const nombreInput = document.getElementById(`nombre-${familia.id}`);
                        const ordenInput = document.getElementById(`orden-${familia.id}`);
                        actualizarFamilia(familia.id, {
                          nombre: nombreInput.value,
                          orden: parseInt(ordenInput.value) || 0
                        });
                      }}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditandoFamilia(null)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-800">{familia.nombre}</h3>
                    <span className="text-xs text-gray-500">Orden: {familia.orden}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                      {trabajos[familia.id]?.length || 0} trabajos
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditandoFamilia(familia.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Editar familia"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => eliminarFamilia(familia.id)}
                  className="p-1 hover:bg-red-100 rounded"
                  title="Eliminar familia"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            {/* Lista de trabajos de la familia */}
            {familiasAbiertas[familia.id] && (
              <div className="p-4 space-y-2">
                {trabajos[familia.id]?.map(trabajo => (
                  <div key={trabajo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    {editandoTrabajo === trabajo.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          defaultValue={trabajo.nombre}
                          className="input-field text-sm py-1 flex-1"
                          id={`trabajo-nombre-${trabajo.id}`}
                        />
                        <input
                          type="number"
                          defaultValue={trabajo.tarifa_base}
                          className="input-field text-sm py-1 w-24"
                          step="0.01"
                          id={`trabajo-tarifa-${trabajo.id}`}
                        />
                        <input
                          type="text"
                          defaultValue={trabajo.descripcion || ''}
                          className="input-field text-sm py-1 flex-1"
                          id={`trabajo-desc-${trabajo.id}`}
                          placeholder="Descripción"
                        />
                        <select
                          defaultValue={trabajo.activo ? 'activo' : 'inactivo'}
                          className="input-field text-sm py-1 w-24"
                          id={`trabajo-activo-${trabajo.id}`}
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                        </select>
                        <button
                          onClick={() => {
                            const nombre = document.getElementById(`trabajo-nombre-${trabajo.id}`).value;
                            const tarifa = parseFloat(document.getElementById(`trabajo-tarifa-${trabajo.id}`).value) || 0;
                            const desc = document.getElementById(`trabajo-desc-${trabajo.id}`).value;
                            const activo = document.getElementById(`trabajo-activo-${trabajo.id}`).value === 'activo';
                            actualizarTrabajo(trabajo.id, {
                              nombre,
                              tarifa_base: tarifa,
                              descripcion: desc,
                              activo
                            });
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditandoTrabajo(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-4 flex-1">
                          <span className="text-sm text-gray-800">{trabajo.nombre}</span>
                          <span className="text-sm font-medium text-primary-600">{trabajo.tarifa_base}€</span>
                          {trabajo.descripcion && (
                            <span className="text-xs text-gray-500">{trabajo.descripcion}</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            trabajo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {trabajo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditandoTrabajo(trabajo.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => eliminarTrabajo(trabajo.id)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                          <button
                            onClick={() => toggleActivo(trabajo)}
                            className={`p-1 rounded ${
                              trabajo.activo ? 'hover:bg-yellow-100' : 'hover:bg-green-100'
                            }`}
                          >
                            {trabajo.activo ? (
                              <XCircle className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {(!trabajos[familia.id] || trabajos[familia.id].length === 0) && (
                  <p className="text-center text-gray-400 py-4 text-sm">
                    No hay trabajos en esta familia
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
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

export default AdminTrabajos;