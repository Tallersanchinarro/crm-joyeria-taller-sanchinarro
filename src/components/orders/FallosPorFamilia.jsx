import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function FallosPorFamilia({ ordenId, onFallosChange, fallosIniciales = [] }) {
  const [familias, setFamilias] = useState([]);
  const [fallos, setFallos] = useState({});
  const [fallosSeleccionados, setFallosSeleccionados] = useState(fallosIniciales);
  const [familiasAbiertas, setFamiliasAbiertas] = useState({});
  const [loading, setLoading] = useState(true);
  const [modoVista, setModoVista] = useState('selector'); // 'selector' o 'tabla'

  // Configuración de gravedad
  const gravedadConfig = {
    baja: { 
      color: 'bg-green-100 text-green-700 border-green-200', 
      icon: CheckCircle, 
      label: 'Baja',
      bgColor: 'bg-green-500'
    },
    media: { 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
      icon: AlertTriangle, 
      label: 'Media',
      bgColor: 'bg-yellow-500'
    },
    alta: { 
      color: 'bg-orange-100 text-orange-700 border-orange-200', 
      icon: AlertTriangle, 
      label: 'Alta',
      bgColor: 'bg-orange-500'
    },
    critica: { 
      color: 'bg-red-100 text-red-700 border-red-200', 
      icon: XCircle, 
      label: 'Crítica',
      bgColor: 'bg-red-500'
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar familias de fallos activas
      const { data: familiasData } = await supabase
        .from('familias_fallos')
        .select('*')
        .eq('activo', true)
        .order('orden');

      setFamilias(familiasData || []);

      // Cargar fallos predefinidos activos
      const { data: fallosData } = await supabase
        .from('fallos_predefinidos')
        .select('*')
        .eq('activo', true);

      // Agrupar fallos por familia
      const fallosPorFamilia = {};
      fallosData?.forEach(f => {
        if (!fallosPorFamilia[f.familia_id]) {
          fallosPorFamilia[f.familia_id] = [];
        }
        fallosPorFamilia[f.familia_id].push(f);
      });
      
      setFallos(fallosPorFamilia);

      // Abrir primera familia por defecto
      if (familiasData?.length > 0) {
        setFamiliasAbiertas({ [familiasData[0].id]: true });
      }

    } catch (error) {
      console.error('Error cargando fallos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular contadores por familia
  const contadoresPorFamilia = React.useMemo(() => {
    const contadores = {};
    fallosSeleccionados.forEach(fallo => {
      const familiaId = fallo.familia_id;
      contadores[familiaId] = (contadores[familiaId] || 0) + 1;
    });
    return contadores;
  }, [fallosSeleccionados]);

  const toggleFamilia = (familiaId) => {
    setFamiliasAbiertas(prev => ({
      ...prev,
      [familiaId]: !prev[familiaId]
    }));
  };

  const toggleFallo = (fallo) => {
    setFallosSeleccionados(prev => {
      const existe = prev.find(f => f.fallo_id === fallo.id);
      
      if (existe) {
        const nuevos = prev.filter(f => f.fallo_id !== fallo.id);
        onFallosChange?.(nuevos);
        return nuevos;
      } else {
        const nuevoFallo = {
          id: Date.now(),
          fallo_id: fallo.id,
          familia_id: fallo.familia_id,
          nombre: fallo.nombre,
          gravedad: fallo.gravedad || 'media',
          observaciones: '',
          fecha_deteccion: new Date().toISOString()
        };
        const nuevos = [...prev, nuevoFallo];
        onFallosChange?.(nuevos);
        return nuevos;
      }
    });
  };

  const eliminarFallo = (falloId) => {
    setFallosSeleccionados(prev => prev.filter(f => f.id !== falloId && f.fallo_id !== falloId));
    onFallosChange?.(fallosSeleccionados.filter(f => f.id !== falloId && f.fallo_id !== falloId));
  };

  const actualizarObservaciones = (falloId, texto) => {
    setFallosSeleccionados(prev =>
      prev.map(f => {
        if (f.fallo_id === falloId) {
          return { ...f, observaciones: texto };
        }
        return f;
      })
    );
    onFallosChange?.(fallosSeleccionados);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leyenda de familias con contadores */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-700 flex items-center">
            <Layers className="w-4 h-4 mr-2 text-gray-500" />
            Familias de fallos
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {familias.map((familia) => (
            <button
              key={familia.id}
              onClick={() => toggleFamilia(familia.id)}
              className={`
                flex items-center justify-between px-3 py-2 rounded-lg text-sm
                transition-all hover:shadow-md border
                ${contadoresPorFamilia[familia.id] > 0 
                  ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }
              `}
            >
              <span className="text-gray-700">{familia.nombre}</span>
              {contadoresPorFamilia[familia.id] > 0 ? (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-orange-500 text-white">
                  {contadoresPorFamilia[familia.id]}
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

      {/* Selector de vista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setModoVista('tabla')}
            className={`
              px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${modoVista === 'tabla'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            📋 Tabla de fallos ({fallosSeleccionados.length})
          </button>
          <button
            onClick={() => setModoVista('selector')}
            className={`
              px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${modoVista === 'selector'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            🔍 Selector por familias
          </button>
        </div>

        <div className="p-4">
          {/* MODO TABLA */}
          {modoVista === 'tabla' && (
            <div className="space-y-4">
              {fallosSeleccionados.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gravedad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fallo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Familia</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fallosSeleccionados.map((fallo) => {
                        const gravedad = gravedadConfig[fallo.gravedad] || gravedadConfig.media;
                        const Icon = gravedad.icon;
                        const familia = familias.find(f => f.id === fallo.familia_id);
                        
                        return (
                          <tr key={fallo.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${gravedad.color}`}>
                                <Icon className="w-3 h-3" />
                                <span>{gravedad.label}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {fallo.nombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {familia?.nombre || 'Sin familia'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              <input
                                type="text"
                                placeholder="Añadir observación..."
                                value={fallo.observaciones || ''}
                                onChange={(e) => actualizarObservaciones(fallo.fallo_id, e.target.value)}
                                className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-500">
                              {new Date(fallo.fecha_deteccion).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <button
                                onClick={() => eliminarFallo(fallo.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No hay fallos seleccionados</p>
                  <p className="text-sm text-gray-400 mt-1">Ve a "Selector por familias" para añadir fallos</p>
                </div>
              )}
            </div>
          )}

          {/* MODO SELECTOR POR FAMILIAS - CON CHECKBOX SIMPLES */}
          {modoVista === 'selector' && (
            <div className="space-y-4">
              {familias.map(familia => {
                const fallosFamilia = fallos[familia.id] || [];
                const estaAbierta = familiasAbiertas[familia.id];
                const contadorFamilia = contadoresPorFamilia[familia.id] || 0;

                if (fallosFamilia.length === 0) return null;

                return (
                  <div key={familia.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Cabecera de familia */}
                    <button
                      onClick={() => toggleFamilia(familia.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-700">{familia.nombre}</span>
                        {contadorFamilia > 0 && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                            {contadorFamilia} seleccionados
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">
                          {fallosFamilia.length} fallos
                        </span>
                        {estaAbierta ? 
                          <ChevronUp className="w-4 h-4 text-gray-500" /> : 
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        }
                      </div>
                    </button>

                    {/* Fallos de la familia - CON CHECKBOX SIMPLES */}
                    {estaAbierta && (
                      <div className="p-4 space-y-3">
                        {fallosFamilia.map(fallo => {
                          const seleccionado = fallosSeleccionados.find(f => 
                            f.fallo_id === fallo.id
                          );
                          const gravedad = gravedadConfig[fallo.gravedad] || gravedadConfig.media;
                          const Icon = gravedad.icon;

                          return (
                            <div key={fallo.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                checked={!!seleccionado}
                                onChange={() => toggleFallo(fallo)}
                                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs ${gravedad.color}`}>
                                      <Icon className="w-3 h-3" />
                                      <span>{gravedad.label}</span>
                                    </span>
                                    <span className="text-sm font-medium text-gray-800">{fallo.nombre}</span>
                                  </div>
                                </div>
                                
                                {/* Campo de observaciones si está seleccionado */}
                                {seleccionado && (
                                  <div className="mt-2 ml-6">
                                    <input
                                      type="text"
                                      placeholder="Observaciones..."
                                      value={seleccionado.observaciones || ''}
                                      onChange={(e) => actualizarObservaciones(fallo.id, e.target.value)}
                                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resumen de fallos seleccionados (solo visible en modo selector) */}
      {fallosSeleccionados.length > 0 && modoVista === 'selector' && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-orange-800 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Fallos seleccionados ({fallosSeleccionados.length})
            </h4>
            <button
              onClick={() => setModoVista('tabla')}
              className="text-xs text-orange-600 hover:text-orange-800"
            >
              Ver detalles
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {fallosSeleccionados.map((fallo, index) => {
              const gravedad = gravedadConfig[fallo.gravedad] || gravedadConfig.media;
              return (
                <span
                  key={index}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs border ${gravedad.color}`}
                >
                  <span className={`w-2 h-2 rounded-full ${gravedad.bgColor}`} />
                  <span>{fallo.nombre}</span>
                  {fallo.observaciones && <span className="text-xs opacity-75">({fallo.observaciones})</span>}
                  <button
                    onClick={() => eliminarFallo(fallo.id)}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FallosPorFamilia;