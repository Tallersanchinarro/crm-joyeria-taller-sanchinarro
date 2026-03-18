import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Edit2, Save, X, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function TrabajosPorFamilia({ ordenId, onTrabajosChange, trabajosIniciales = [] }) {
  const [familias, setFamilias] = useState([]);
  const [trabajos, setTrabajos] = useState({});
  const [trabajosSeleccionados, setTrabajosSeleccionados] = useState(trabajosIniciales);
  const [familiasAbiertas, setFamiliasAbiertas] = useState({});
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar familias de trabajos
      const { data: familiasData } = await supabase
        .from('familias_trabajos')
        .select('*')
        .order('orden');

      setFamilias(familiasData || []);

      // Cargar trabajos predefinidos
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

    } catch (error) {
      console.error('Error cargando trabajos:', error);
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

  const toggleTrabajo = (trabajo, tipo) => {
    setTrabajosSeleccionados(prev => {
      const existe = prev.find(t => t.trabajo_id === trabajo.id);
      
      if (existe) {
        const nuevos = prev.filter(t => t.trabajo_id !== trabajo.id);
        onTrabajosChange?.(nuevos);
        return nuevos;
      } else {
        const nuevo = {
          id: Date.now(),
          trabajo_id: trabajo.id,
          nombre: trabajo.nombre,
          tipo_seleccion: tipo,
          tarifa_base: trabajo.tarifa_base,
          tarifa_aplicada: trabajo.tarifa_base,
          descuento: 0,
          cantidad: 1,
          total: trabajo.tarifa_base
        };
        const nuevos = [...prev, nuevo];
        onTrabajosChange?.(nuevos);
        return nuevos;
      }
    });
  };

  const actualizarPrecio = (trabajoId, campo, valor) => {
    setTrabajosSeleccionados(prev => 
      prev.map(t => {
        if (t.trabajo_id === trabajoId) {
          const updated = { ...t, [campo]: valor };
          
          // Recalcular total
          const tarifa = campo === 'tarifa_aplicada' ? valor : t.tarifa_aplicada;
          const descuento = campo === 'descuento' ? valor : t.descuento;
          const cantidad = campo === 'cantidad' ? valor : t.cantidad;
          
          updated.total = (tarifa * cantidad) * (1 - (descuento || 0) / 100);
          
          return updated;
        }
        return t;
      })
    );
  };

  const getTipoColor = (tipo) => {
    const colores = {
      'obligatorio': 'bg-green-500',
      'sugerido': 'bg-blue-500',
      'seleccionado_cliente': 'bg-yellow-500',
      'descartado': 'bg-gray-500'
    };
    return colores[tipo] || 'bg-gray-300';
  };

  if (loading) {
    return <div className="text-center py-4">Cargando trabajos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Lista de trabajos seleccionados (tabla editable) */}
      {trabajosSeleccionados.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Trabajo</th>
                <th className="px-3 py-2 text-right">Tarifa base</th>
                <th className="px-3 py-2 text-right">Tarifa aplicada</th>
                <th className="px-3 py-2 text-right">Dto %</th>
                <th className="px-3 py-2 text-right">Cant</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trabajosSeleccionados.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span className={`w-3 h-3 rounded-full inline-block ${getTipoColor(t.tipo_seleccion)}`} />
                  </td>
                  <td className="px-3 py-2 font-medium">{t.nombre}</td>
                  <td className="px-3 py-2 text-right">{t.tarifa_base?.toFixed(2)}€</td>
                  <td className="px-3 py-2 text-right">
                    {editandoPrecio === t.trabajo_id ? (
                      <input
                        type="number"
                        defaultValue={t.tarifa_aplicada}
                        onChange={(e) => actualizarPrecio(t.trabajo_id, 'tarifa_aplicada', parseFloat(e.target.value) || 0)}
                        className="w-20 text-right input-field text-xs py-1"
                        step="0.01"
                        autoFocus
                      />
                    ) : (
                      <span 
                        onClick={() => setEditandoPrecio(t.trabajo_id)}
                        className="cursor-pointer hover:text-primary-600"
                      >
                        {t.tarifa_aplicada?.toFixed(2)}€
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editandoPrecio === t.trabajo_id ? (
                      <input
                        type="number"
                        defaultValue={t.descuento}
                        onChange={(e) => actualizarPrecio(t.trabajo_id, 'descuento', parseFloat(e.target.value) || 0)}
                        className="w-16 text-right input-field text-xs py-1"
                        step="0.1"
                      />
                    ) : (
                      <span 
                        onClick={() => setEditandoPrecio(t.trabajo_id)}
                        className="cursor-pointer hover:text-primary-600"
                      >
                        {t.descuento}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editandoPrecio === t.trabajo_id ? (
                      <input
                        type="number"
                        defaultValue={t.cantidad}
                        onChange={(e) => actualizarPrecio(t.trabajo_id, 'cantidad', parseInt(e.target.value) || 1)}
                        className="w-16 text-right input-field text-xs py-1"
                        min="1"
                      />
                    ) : (
                      <span 
                        onClick={() => setEditandoPrecio(t.trabajo_id)}
                        className="cursor-pointer hover:text-primary-600"
                      >
                        {t.cantidad}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-primary-600">
                    {t.total?.toFixed(2)}€
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan="6" className="px-3 py-2 text-right font-bold">TOTAL:</td>
                <td className="px-3 py-2 text-right font-bold text-primary-600">
                  {trabajosSeleccionados.reduce((sum, t) => sum + (t.total || 0), 0).toFixed(2)}€
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Selector de trabajos por familias (igual que antes) */}
      <div className="space-y-2">
        {familias.map(familia => (
          <div key={familia.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleFamilia(familia.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
            >
              <span className="font-medium text-gray-700">{familia.nombre}</span>
              {familiasAbiertas[familia.id] ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </button>

            {familiasAbiertas[familia.id] && (
              <div className="p-3 space-y-2">
                {trabajos[familia.id]?.map(trabajo => {
                  const seleccionado = trabajosSeleccionados.find(t => t.trabajo_id === trabajo.id);
                  
                  return (
                    <div key={trabajo.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {/* Checkboxes de tipo */}
                        {['obligatorio', 'sugerido', 'seleccionado_cliente', 'descartado'].map(tipo => (
                          <button
                            key={tipo}
                            onClick={() => toggleTrabajo(trabajo, tipo)}
                            className={`w-6 h-6 rounded flex items-center justify-center ${
                              seleccionado?.tipo_seleccion === tipo 
                                ? getTipoColor(tipo) + ' text-white' 
                                : 'border-2 border-gray-300 hover:border-gray-400'
                            }`}
                            title={tipo.replace('_', ' ')}
                          >
                            {seleccionado?.tipo_seleccion === tipo && '✓'}
                          </button>
                        ))}
                        <span className="flex-1 text-sm">{trabajo.nombre}</span>
                        <span className="text-sm font-medium">{trabajo.tarifa_base}€</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrabajosPorFamilia;