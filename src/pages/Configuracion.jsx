import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Percent,
  Users,
  Shield,
  Database,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

function Configuracion() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    empresa: {
      nombre: 'LAM-RELOJEROS S.L',
      cif: 'B-88615489',
      telefono: '672373275',
      email: 'info@lam-relojeros.com',
      direccion: 'C/ Ejemplo, 123',
      ciudad: '28001 Madrid',
      web: 'www.lam-relojeros.com'
    },
    impuestos: {
      iva: 21,
      irpf: 0
    },
    notificaciones: {
      email_presupuesto: true,
      email_factura: true,
      email_recordatorio: false
    }
  });

  // Cargar configuración guardada
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracion')
          .select('*')
          .single();

        if (!error && data) {
          setConfig(data);
        }
      } catch (error) {
        console.log('Usando configuración por defecto');
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert({ id: 1, ...config });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building },
    { id: 'impuestos', label: 'Impuestos', icon: Percent },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'datos', label: 'Datos', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-primary-600" />
            Configuración
          </h1>
          <p className="text-sm text-gray-500">
            Gestiona los ajustes de tu taller de joyería
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Guardar cambios</span>
        </button>
      </div>

      {/* Mensaje de éxito */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">Configuración guardada correctamente</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-all
                  ${isActive 
                    ? 'border-b-2 border-primary-500 text-primary-600 bg-white' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Empresa */}
          {activeTab === 'empresa' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Building className="w-5 h-5 mr-2 text-primary-500" />
                Datos de la empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    value={config.empresa.nombre}
                    onChange={(e) => setConfig({...config, empresa: {...config.empresa, nombre: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CIF / NIF
                  </label>
                  <input
                    type="text"
                    value={config.empresa.cif}
                    onChange={(e) => setConfig({...config, empresa: {...config.empresa, cif: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={config.empresa.telefono}
                    onChange={(e) => setConfig({...config, empresa: {...config.empresa, telefono: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.empresa.email}
                    onChange={(e) => setConfig({...config, empresa: {...config.empresa, email: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={config.empresa.direccion}
                    onChange={(e) => setConfig({...config, empresa: {...config.empresa, direccion: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={config.empresa.ciudad}
                    onChange={(e) => setConfig({...config, empresa: {...config.empresa, ciudad: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio web
                  </label>
                  <input
                    type="text"
                    value={config.empresa.web}
                    onChange={(e) => setConfig({...config, empresa: {...config.empresa, web: e.target.value}})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Impuestos */}
          {activeTab === 'impuestos' && (
            <div className="space-y-6 max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Percent className="w-5 h-5 mr-2 text-primary-500" />
                Configuración de impuestos
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IVA (%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={config.impuestos.iva}
                    onChange={(e) => setConfig({...config, impuestos: {...config.impuestos, iva: parseFloat(e.target.value) || 0}})}
                    className="input-field w-32"
                    step="0.1"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje de IVA aplicado a los presupuestos
                </p>
              </div>
            </div>
          )}

          {/* Usuarios */}
          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary-500" />
                Usuarios del sistema
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Gestión de usuarios próximamente</p>
                <p className="text-sm text-gray-400">Podrás añadir y gestionar usuarios del taller</p>
              </div>
            </div>
          )}

          {/* Seguridad */}
          {activeTab === 'seguridad' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary-500" />
                Seguridad
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Configuración de seguridad próximamente</p>
                <p className="text-sm text-gray-400">Autenticación de dos factores, copias de seguridad, etc.</p>
              </div>
            </div>
          )}

          {/* Datos */}
          {activeTab === 'datos' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary-500" />
                Gestión de datos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-primary-200 transition-colors">
                  <Database className="w-8 h-8 text-primary-500 mb-2" />
                  <h4 className="font-medium">Exportar datos</h4>
                  <p className="text-xs text-gray-500">Exportar clientes, órdenes y presupuestos</p>
                </button>
                <button className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-red-200 transition-colors">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <h4 className="font-medium">Borrar datos de prueba</h4>
                  <p className="text-xs text-gray-500">Eliminar todos los datos de prueba del sistema</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Configuracion;