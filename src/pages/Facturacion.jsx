import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  FileText,
  Download,
  Search,
  Calendar,
  Euro,
  CheckCircle,
  AlertCircle,
  Printer,
  Eye,
  PlusCircle,
  Filter,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

function Facturacion() {
  const navigate = useNavigate();
  const { orders, clients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Órdenes entregadas que se pueden facturar
  const deliveredOrders = orders.filter(o => 
    o.status === 'Entregado' && o.budget > 0 && !o.invoiced
  );

  // Filtrar órdenes
  const filteredOrders = deliveredOrders.filter(order => {
    const client = clients.find(c => c.id === order.client_id);
    return (
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Cargar facturas existentes
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from('facturas')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error) {
          setInvoices(data || []);
        }
      } catch (error) {
        console.error('Error cargando facturas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const generarFactura = async () => {
    if (!selectedOrder) return;
    
    setGenerating(true);
    
    try {
      const client = clients.find(c => c.id === selectedOrder.client_id);
      const numeroFactura = `F${new Date().getFullYear()}${String(invoices.length + 1).padStart(4, '0')}`;
      
      const facturaData = {
        order_id: selectedOrder.id,
        numero: numeroFactura,
        fecha: new Date().toISOString(),
        cliente_nombre: client?.name || selectedOrder.client_name,
        cliente_nif: client?.nif || '',
        cliente_direccion: client?.address || '',
        cliente_email: client?.email || selectedOrder.client_email,
        concepto: `Reparación de ${selectedOrder.item_type} - ${selectedOrder.order_number}`,
        base_imponible: selectedOrder.budget / 1.21,
        iva: selectedOrder.budget - (selectedOrder.budget / 1.21),
        total: selectedOrder.budget,
        estado: 'pagada',
        created_at: new Date().toISOString()
      };

      // Guardar en Supabase (crear tabla facturas si no existe)
      const { error } = await supabase
        .from('facturas')
        .insert([facturaData]);

      if (error) {
        // Si la tabla no existe, mostrar mensaje
        console.log('Tabla facturas no existe, guardando localmente');
        const localInvoices = JSON.parse(localStorage.getItem('facturas') || '[]');
        localInvoices.unshift({ ...facturaData, id: Date.now() });
        localStorage.setItem('facturas', JSON.stringify(localInvoices));
        setInvoices(localInvoices);
      } else {
        setInvoices(prev => [facturaData, ...prev]);
      }

      // Marcar orden como facturada
      await supabase
        .from('ordenes')
        .update({ invoiced: true })
        .eq('id', selectedOrder.id);

      setShowInvoiceModal(false);
      setSelectedOrder(null);
      
    } catch (error) {
      console.error('Error generando factura:', error);
      alert('Error al generar la factura');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Receipt className="w-6 h-6 mr-2 text-primary-600" />
            Facturación
          </h1>
          <p className="text-sm text-gray-500">
            Genera y gestiona las facturas de tus reparaciones
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por orden, cliente o joya..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Lista de órdenes para facturar */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-700">Órdenes pendientes de facturar</h2>
          <p className="text-sm text-gray-500">{filteredOrders.length} reparaciones entregadas</p>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay órdenes pendientes de facturar</p>
            <button
              onClick={() => navigate('/reparaciones-activas')}
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver reparaciones activas
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const client = clients.find(c => c.id === order.client_id);
              return (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {order.order_number}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Entregado
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {client?.name || order.client_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.item_type} · {order.material}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-lg font-bold text-primary-600">{order.budget}€</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowInvoiceModal(true);
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Facturar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de facturas */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Historial de facturas</h2>
            <p className="text-sm text-gray-500">{invoices.length} facturas emitidas</p>
          </div>
          <div className="divide-y divide-gray-200">
            {invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {invoice.numero}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(invoice.fecha)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{invoice.cliente_nombre}</p>
                    <p className="text-xs text-gray-500">{invoice.concepto}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="font-bold text-primary-600">{invoice.total.toFixed(2)}€</p>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Ver factura">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Descargar PDF">
                      <Download className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación de factura */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-primary-500" />
                Generar factura
              </h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Orden</p>
                <p className="font-medium">{selectedOrder.order_number}</p>
                <p className="text-sm text-gray-500 mt-2">Cliente</p>
                <p className="font-medium">
                  {clients.find(c => c.id === selectedOrder.client_id)?.name || selectedOrder.client_name}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base imponible</span>
                  <span>{(selectedOrder.budget / 1.21).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (21%)</span>
                  <span>{(selectedOrder.budget - (selectedOrder.budget / 1.21)).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-800">Total</span>
                  <span className="text-primary-600">{selectedOrder.budget}€</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={generarFactura}
                disabled={generating}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center space-x-2"
              >
                {generating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Generar factura</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Facturacion;