import React, { useState, useEffect } from 'react';
import { 
  X,
  Euro,
  Edit2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function TrabajosPorFamilia({ ordenId, onTrabajosChange, trabajosIniciales = [] }) {
  const [familias, setFamilias] = useState([]);
  const [trabajos, setTrabajos] = useState({});
  const [trabajosSeleccionados, setTrabajosSeleccionados] = useState(trabajosIniciales);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState(null);
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoVista, setModoVista] = useState('selector');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data: familiasData } = await supabase
        .from('familias_trabajos')
        .select('*')
        .order('orden');

      setFamilias(familiasData || []);

      const { data: trabajosData } = await supabase
        .from('trabajos_predefinidos')
        .select('*')
        .eq('activo', true);

      const trabajosPorFamilia = {};
      trabajosData?.forEach(t => {
        if (!trabajosPorFamilia[t.familia_id]) {
          trabajosPorFamilia[t.familia_id] = [];
        }
        trabajosPorFamilia[t.familia_id].push(t);
      });
      
      setTrabajos(trabajosPorFamilia);

      // Seleccionar primera familia por defecto
      if (familiasData?.length > 0) {
        setFamiliaSeleccionada(familiasData[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contadoresPorFamilia = React.useMemo(() => {
    const contadores = {};
    trabajosSeleccionados.forEach(t => {
      contadores[t.familia_id] = (contadores[t.familia_id] || 0) + 1;
    });
    return contadores;
  }, [trabajosSeleccionados]);

  const toggleTrabajo = (trabajo) => {
    setTrabajosSeleccionados(prev => {
      const existe = prev.find(t => t.trabajo_id === trabajo.id);
      
      if (existe) {
        const nuevos = prev.filter(t => t.trabajo_id !== trabajo.id);
        onTrabajosChange?.(nuevos);
        return nuevos;
      } else {
        const tarifaInicial = parseFloat(trabajo.tarifa_base) || 0;
        
        const nuevoTrabajo = {
          id: Date.now(),
          trabajo_id: trabajo.id,
          familia_id: trabajo.familia_id,
          nombre: trabajo.nombre,
          tarifa_base: tarifaInicial,
          tarifa_aplicada: tarifaInicial,
          descuento: 0,
          cantidad: 1,
          total: tarifaInicial
        };
        const nuevos = [...prev, nuevoTrabajo];
        onTrabajosChange?.(nuevos);
        return nuevos;
      }
    });
  };

  const eliminarTrabajo = (trabajoId) => {
    setTrabajosSeleccionados(prev => prev.filter(t => t.id !== trabajoId && t.trabajo_id !== trabajoId));
    onTrabajosChange?.(trabajosSeleccionados.filter(t => t.id !== trabajoId && t.trabajo_id !== trabajoId));
  };

  const actualizarPrecio = (trabajoId, nuevoPrecio) => {
    setTrabajosSeleccionados(prev => {
      const nuevos = prev.map(t => {
        if (t.trabajo_id === trabajoId) {
          const precio = parseFloat(nuevoPrecio) || 0;
          const updated = { 
            ...t, 
            tarifa_aplicada: precio,
            total: precio * (t.cantidad || 1) * (1 - (t.descuento || 0) / 100)
          };
          return updated;
        }
        return t;
      });
      onTrabajosChange?.(nuevos);
      return nuevos;
    });
    setEditandoPrecio(null);
  };

  const actualizarCantidad = (trabajoId, nuevaCantidad) => {
    setTrabajosSeleccionados(prev => {
      const nuevos = prev.map(t => {
        if (t.trabajo_id === trabajoId) {
          const cantidad = parseInt(nuevaCantidad) || 1;
          const updated = { 
            ...t, 
            cantidad: cantidad,
            total: (t.tarifa_aplicada || 0) * cantidad * (1 - (t.descuento || 0) / 100)
          };
          return updated;
        }
        return t;
      });
      onTrabajosChange?.(nuevos);
      return nuevos;
    });
  };

  const actualizarDescuento = (trabajoId, nuevoDescuento) => {
    setTrabajosSeleccionados(prev => {
      const nuevos = prev.map(t => {
        if (t.trabajo_id === trabajoId) {
          const descuento = parseFloat(nuevoDescuento) || 0;
          const updated = { 
            ...t, 
            descuento: descuento,
            total: (t.tarifa_aplicada || 0) * (t.cantidad || 1) * (1 - descuento / 100)
          };
          return updated;
        }
        return t;
      });
      onTrabajosChange?.(nuevos);
      return nuevos;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Obtener los trabajos de la familia seleccionada
  const trabajosDeFamilia = trabajos[familiaSeleccionada] || [];
  const familiaActual = familias.find(f => f.id === familiaSeleccionada);

  return (
    <div className="space-y-6">
      {/* Selector de vista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 flex">
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
            🔍 Seleccionar trabajos
          </button>
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
            📋 Tabla de trabajos ({trabajosSeleccionados.length})
          </button>
        </div>

        <div className="p-4">
          {/* MODO SELECTOR - Con familias arriba y trabajos debajo */}
          {modoVista === 'selector' && (
            <div className="space-y-6">
              {/* Leyenda de familias (solo visual, sin acordeón) */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Familias de trabajos</h3>
                <div className="flex flex-wrap gap-2">
                  {familias.map((familia) => (
                    <button
                      key={familia.id}
                      onClick={() => setFamiliaSeleccionada(familia.id)}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${familiaSeleccionada === familia.id
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      <span>{familia.nombre}</span>
                      {contadoresPorFamilia[familia.id] > 0 && (
                        <span className={`
                          ml-1 px-2 py-0.5 rounded-full text-xs
                          ${familiaSeleccionada === familia.id
                            ? 'bg-white text-primary-600'
                            : 'bg-primary-500 text-white'
                          }
                        `}>
                          {contadoresPorFamilia[familia.id]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trabajos de la familia seleccionada */}
              {familiaActual && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">
                      Trabajos de {familiaActual.nombre}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {trabajosDeFamilia.length > 0 ? (
                      trabajosDeFamilia.map(trabajo => {
                        const seleccionado = trabajosSeleccionados.find(t => t.trabajo_id === trabajo.id);
                        const editando = editandoPrecio === `selector-${trabajo.id}`;
                        
                        return (
                          <div key={trabajo.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={!!seleccionado}
                                  onChange={() => toggleTrabajo(trabajo)}
                                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-800 font-medium">{trabajo.nombre}</span>
                              </div>
                              
                              {seleccionado ? (
                                <div className="flex items-center space-x-3">
                                  {editando ? (
                                    <input
                                      type="number"
                                      defaultValue={seleccionado.tarifa_aplicada}
                                      onBlur={(e) => {
                                        actualizarPrecio(seleccionado.trabajo_id, e.target.value);
                                        setEditandoPrecio(null);
                                      }}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          actualizarPrecio(seleccionado.trabajo_id, e.target.value);
                                          setEditandoPrecio(null);
                                        }
                                      }}
                                      className="w-24 text-right px-2 py-1 border rounded text-sm"
                                      step="0.01"
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span 
                                        onDoubleClick={() => setEditandoPrecio(`selector-${trabajo.id}`)}
                                        className="text-primary-600 font-medium cursor-pointer hover:bg-primary-50 px-2 py-1 rounded"
                                        title="Doble click para editar"
                                      >
                                        {seleccionado.tarifa_aplicada?.toFixed(2)}€
                                      </span>
                                      <button
                                        onClick={() => setEditandoPrecio(`selector-${trabajo.id}`)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  {parseFloat(trabajo.tarifa_base).toFixed(2)}€
                                </span>
                              )}
                            </div>
                            
                            {/* Controles de cantidad y descuento cuando está seleccionado */}
                            {seleccionado && (
                              <div className="flex items-center space-x-4 mt-3 ml-8">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Cantidad:</span>
                                  <input
                                    type="number"
                                    value={seleccionado.cantidad}
                                    onChange={(e) => actualizarCantidad(seleccionado.trabajo_id, e.target.value)}
                                    className="w-16 text-center px-2 py-1 border rounded text-sm"
                                    min="1"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Descuento:</span>
                                  <input
                                    type="number"
                                    value={seleccionado.descuento || 0}
                                    onChange={(e) => actualizarDescuento(seleccionado.trabajo_id, e.target.value)}
                                    className="w-16 text-center px-2 py-1 border rounded text-sm"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                  />
                                  <span className="text-xs text-gray-500">%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No hay trabajos en esta familia</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO TABLA - igual que antes */}
          {modoVista === 'tabla' && (
            <div className="space-y-4">
              {trabajosSeleccionados.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Familia</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dto %</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trabajosSeleccionados.map((trabajo) => {
                        const familia = familias.find(f => f.id === trabajo.familia_id);
                        const editando = editandoPrecio === trabajo.trabajo_id;
                        
                        return (
                          <tr key={trabajo.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {trabajo.nombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {familia?.nombre || 'Sin familia'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {editando ? (
                                <input
                                  type="number"
                                  defaultValue={trabajo.tarifa_aplicada}
                                  onBlur={(e) => actualizarPrecio(trabajo.trabajo_id, e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      actualizarPrecio(trabajo.trabajo_id, e.target.value);
                                    }
                                  }}
                                  className="w-20 text-right px-2 py-1 border rounded text-sm"
                                  step="0.01"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center justify-end space-x-2">
                                  <span 
                                    onDoubleClick={() => setEditandoPrecio(trabajo.trabajo_id)}
                                    className="cursor-pointer hover:text-primary-600 hover:bg-primary-50 px-2 py-1 rounded font-medium"
                                    title="Doble click para editar"
                                  >
                                    {trabajo.tarifa_aplicada?.toFixed(2)}€
                                  </span>
                                  <button
                                    onClick={() => setEditandoPrecio(trabajo.trabajo_id)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <input
                                type="number"
                                value={trabajo.descuento || 0}
                                onChange={(e) => actualizarDescuento(trabajo.trabajo_id, e.target.value)}
                                className="w-16 text-right px-2 py-1 border rounded text-sm"
                                step="0.1"
                                min="0"
                                max="100"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <input
                                type="number"
                                value={trabajo.cantidad || 1}
                                onChange={(e) => actualizarCantidad(trabajo.trabajo_id, e.target.value)}
                                className="w-16 text-right px-2 py-1 border rounded text-sm"
                                min="1"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-primary-600">
                              {(trabajo.total || 0).toFixed(2)}€
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <button
                                onClick={() => eliminarTrabajo(trabajo.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right font-bold text-gray-700">
                          TOTAL TRABAJOS:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary-600">
                          {trabajosSeleccionados.reduce((sum, t) => sum + (t.total || 0), 0).toFixed(2)}€
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No hay trabajos seleccionados</p>
                  <p className="text-sm text-gray-400 mt-1">Ve a "Seleccionar trabajos" para añadir trabajos</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resumen de trabajos seleccionados */}
      {trabajosSeleccionados.length > 0 && modoVista === 'selector' && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-800 flex items-center">
              <Euro className="w-4 h-4 mr-2" />
              Trabajos seleccionados ({trabajosSeleccionados.length})
            </h4>
            <button onClick={() => setModoVista('tabla')} className="text-xs text-blue-600 hover:text-blue-800">
              Ver detalles
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {trabajosSeleccionados.map((trabajo, index) => (
              <span key={index} className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs bg-white border border-blue-200 text-blue-700">
                <span>{trabajo.nombre}</span>
                <span className="font-bold ml-1">{trabajo.tarifa_aplicada?.toFixed(2)}€</span>
                {trabajo.cantidad > 1 && <span className="text-xs">(x{trabajo.cantidad})</span>}
                {trabajo.descuento > 0 && <span className="text-xs">-{trabajo.descuento}%</span>}
                <button onClick={() => eliminarTrabajo(trabajo.id)} className="ml-1 hover:bg-blue-100 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-primary-100 text-primary-700 font-bold">
              Total: {trabajosSeleccionados.reduce((sum, t) => sum + (t.total || 0), 0).toFixed(2)}€
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrabajosPorFamilia;