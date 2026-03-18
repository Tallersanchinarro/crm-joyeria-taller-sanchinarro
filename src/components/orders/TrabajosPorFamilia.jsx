import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  X,
  Euro,
  Edit2,
  Save,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function TrabajosPorFamilia({ ordenId, onTrabajosChange, trabajosIniciales = [] }) {
  const [familias, setFamilias] = useState([]);
  const [trabajos, setTrabajos] = useState({});
  const [trabajosSeleccionados, setTrabajosSeleccionados] = useState(trabajosIniciales);
  const [familiasAbiertas, setFamiliasAbiertas] = useState({});
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

      if (familiasData?.length > 0) {
        setFamiliasAbiertas({ [familiasData[0].id]: true });
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

  const toggleFamilia = (familiaId) => {
    setFamiliasAbiertas(prev => ({
      ...prev,
      [familiaId]: !prev[familiaId]
    }));
  };

  const toggleTrabajo = (trabajo) => {
    setTrabajosSeleccionados(prev => {
      const existe = prev.find(t => t.trabajo_id === trabajo.id);
      
      if (existe) {
        const nuevos = prev.filter(t => t.trabajo_id !== trabajo.id);
        onTrabajosChange?.(nuevos);
        return nuevos;
      } else {
        // Usar tarifa_base como valor inicial, pero será editable
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
        console.log('✅ Trabajo seleccionado:', nuevoTrabajo);
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
          console.log('💰 Precio actualizado:', updated);
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

  return (
    <div className="space-y-6">
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
            📋 Tabla de trabajos ({trabajosSeleccionados.length})
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
                                  <span className="cursor-pointer hover:text-primary-600 font-medium">
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
                  <p className="text-sm text-gray-400 mt-1">Ve a "Selector por familias" para añadir trabajos</p>
                </div>
              )}
            </div>
          )}

          {/* MODO SELECTOR POR FAMILIAS - CON PRECIO EDITABLE */}
          {modoVista === 'selector' && (
            <div className="space-y-4">
              {familias.map(familia => {
                const trabajosFamilia = trabajos[familia.id] || [];
                const estaAbierta = familiasAbiertas[familia.id];
                const contadorFamilia = contadoresPorFamilia[familia.id] || 0;

                if (trabajosFamilia.length === 0) return null;

                return (
                  <div key={familia.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFamilia(familia.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-700">{familia.nombre}</span>
                        {contadorFamilia > 0 && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            {contadorFamilia} seleccionados
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">{trabajosFamilia.length} trabajos</span>
                        {estaAbierta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {estaAbierta && (
                      <div className="p-4 space-y-3">
                        {trabajosFamilia.map(trabajo => {
                          const seleccionado = trabajosSeleccionados.find(t => t.trabajo_id === trabajo.id);
                          const editando = editandoPrecio === `selector-${trabajo.id}`;
                          
                          return (
                            <div key={trabajo.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                              <input
                                type="checkbox"
                                checked={!!seleccionado}
                                onChange={() => toggleTrabajo(trabajo)}
                                className="mt-1 rounded border-gray-300 text-primary-600"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-800">{trabajo.nombre}</span>
                                  
                                  {seleccionado ? (
                                    <div className="flex items-center space-x-2">
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
                                          className="w-20 text-right px-2 py-1 border rounded text-sm"
                                          step="0.01"
                                          autoFocus
                                        />
                                      ) : (
                                        <>
                                          <span className="text-sm font-medium text-primary-600">
                                            {seleccionado.tarifa_aplicada?.toFixed(2)}€
                                          </span>
                                          <button
                                            onClick={() => setEditandoPrecio(`selector-${trabajo.id}`)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                      {seleccionado.cantidad > 1 && (
                                        <span className="text-xs text-gray-400 ml-2">
                                          x{seleccionado.cantidad}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      {parseFloat(trabajo.tarifa_base).toFixed(2)}€
                                    </span>
                                  )}
                                </div>
                                
                                {/* Inputs de cantidad y descuento cuando está seleccionado */}
                                {seleccionado && (
                                  <div className="flex items-center space-x-4 mt-2 ml-6">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Cant:</span>
                                      <input
                                        type="number"
                                        value={seleccionado.cantidad}
                                        onChange={(e) => actualizarCantidad(seleccionado.trabajo_id, e.target.value)}
                                        className="w-16 text-right px-2 py-1 border rounded text-xs"
                                        min="1"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Dto:</span>
                                      <input
                                        type="number"
                                        value={seleccionado.descuento || 0}
                                        onChange={(e) => actualizarDescuento(seleccionado.trabajo_id, e.target.value)}
                                        className="w-16 text-right px-2 py-1 border rounded text-xs"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                      />
                                      <span className="text-xs text-gray-500">%</span>
                                    </div>
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