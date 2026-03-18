import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function FallosPorFamilia({ ordenId, onFallosChange, fallosIniciales = [] }) {
  const [familias, setFamilias] = useState([]);
  const [fallos, setFallos] = useState({});
  const [fallosSeleccionados, setFallosSeleccionados] = useState(fallosIniciales);
  const [familiasAbiertas, setFamiliasAbiertas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar familias de fallos
      const { data: familiasData } = await supabase
        .from('familias_fallos')
        .select('*')
        .order('orden');

      setFamilias(familiasData || []);

      // Cargar fallos predefinidos
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

    } catch (error) {
      console.error('Error cargando fallos:', error);
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

  const toggleFallo = (fallo) => {
    setFallosSeleccionados(prev => {
      const existe = prev.find(f => f.id === fallo.id);
      
      if (existe) {
        // Si ya existe, lo quitamos
        const nuevos = prev.filter(f => f.id !== fallo.id);
        onFallosChange?.(nuevos);
        return nuevos;
      } else {
        // Si no existe, lo añadimos
        const nuevo = {
          ...fallo,
          fecha_deteccion: new Date().toISOString()
        };
        const nuevos = [...prev, nuevo];
        onFallosChange?.(nuevos);
        return nuevos;
      }
    });
  };

  const getGravedadColor = (gravedad) => {
    const colores = {
      'baja': 'text-green-600 bg-green-50',
      'media': 'text-yellow-600 bg-yellow-50',
      'alta': 'text-orange-600 bg-orange-50',
      'critica': 'text-red-600 bg-red-50'
    };
    return colores[gravedad] || 'text-gray-600 bg-gray-50';
  };

  const getGravedadIcon = (gravedad) => {
    switch (gravedad) {
      case 'baja': return <CheckCircle className="w-3 h-3" />;
      case 'media': return <AlertTriangle className="w-3 h-3" />;
      case 'alta': return <AlertTriangle className="w-3 h-3" />;
      case 'critica': return <XCircle className="w-3 h-3" />;
      default: return <AlertTriangle className="w-3 h-3" />;
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando fallos...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-3">Seleccionar fallos detectados</h3>

      {/* Familias de fallos */}
      <div className="space-y-2">
        {familias.map(familia => (
          <div key={familia.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Cabecera de familia */}
            <button
              onClick={() => toggleFamilia(familia.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-700">{familia.nombre}</span>
              <span className="text-xs text-gray-500">
                {fallos[familia.id]?.length || 0} fallos
              </span>
            </button>

            {/* Fallos de la familia */}
            {familiasAbiertas[familia.id] && (
              <div className="p-3 space-y-2">
                {fallos[familia.id]?.map(fallo => {
                  const seleccionado = fallosSeleccionados.find(f => f.id === fallo.id);
                  
                  return (
                    <div
                      key={fallo.id}
                      onClick={() => toggleFallo(fallo)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg cursor-pointer
                        transition-colors border
                        ${seleccionado 
                          ? 'bg-primary-50 border-primary-200' 
                          : 'bg-white border-gray-100 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-2 h-2 rounded-full ${
                          seleccionado ? 'bg-primary-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{fallo.nombre}</p>
                          {fallo.descripcion && (
                            <p className="text-xs text-gray-500">{fallo.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${getGravedadColor(fallo.gravedad)}`}>
                        {getGravedadIcon(fallo.gravedad)}
                        <span>{fallo.gravedad}</span>
                      </span>
                    </div>
                  );
                })}

                {(!fallos[familia.id] || fallos[familia.id].length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    No hay fallos en esta familia
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen de fallos seleccionados */}
      {fallosSeleccionados.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-3">Fallos detectados ({fallosSeleccionados.length})</h4>
          <div className="space-y-2">
            {fallosSeleccionados.map((fallo, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{fallo.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getGravedadColor(fallo.gravedad)}`}>
                  {fallo.gravedad}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FallosPorFamilia;