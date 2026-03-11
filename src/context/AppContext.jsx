import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Obtener usuario actual al cargar
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        fetchClients();
        fetchOrders();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Cargar datos cuando hay usuario
  useEffect(() => {
    if (user) {
      fetchClients();
      fetchOrders();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
    }
  };

  // Suscripciones en tiempo real
  useEffect(() => {
    if (!user) return;

    const ordenesSubscription = supabase
      .channel('cambios-ordenes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        }
        if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id ? payload.new : order
          ));
        }
        if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(order => order.id !== payload.old.id));
        }
      })
      .subscribe();

    const clientesSubscription = supabase
      .channel('cambios-clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setClients(prev => [payload.new, ...prev]);
        }
        if (payload.eventType === 'UPDATE') {
          setClients(prev => prev.map(client => 
            client.id === payload.new.id ? payload.new : client
          ));
        }
        if (payload.eventType === 'DELETE') {
          setClients(prev => prev.filter(client => client.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordenesSubscription);
      supabase.removeChannel(clientesSubscription);
    };
  }, [user]);

  // FUNCIONES CRUD (se mantienen igual que antes)
  const createClient = async (clientData) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          ...clientData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating client:', error.message);
      throw error;
    }
  };

  const updateClient = async (clientId, updates) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating client:', error.message);
      throw error;
    }
  };

  const createOrder = async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .insert([{
          ...orderData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating order:', error.message);
      throw error;
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating order:', error.message);
      throw error;
    }
  };

  const getStats = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return {
      activeOrders: orders.filter(o => 
        o.status !== 'Entregado' && o.status !== 'Rechazado'
      ).length,
      newClients: clients.filter(c => {
        const d = new Date(c.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length,
      monthlyRevenue: orders
        .filter(o => o.status === 'Entregado')
        .reduce((sum, o) => sum + (o.budget || 0), 0),
      readyForPickup: orders.filter(o => o.status === 'Listo').length,
      pendingBudget: orders.filter(o => o.status === 'Presupuestado').length,
      inAnalysis: orders.filter(o => o.status === 'En análisis').length,
      inRepair: orders.filter(o => o.status === 'En reparación').length
    };
  };

  const value = {
    orders,
    clients,
    loading,
    user,
    createClient,
    updateClient,
    createOrder,
    updateOrder,
    getStats,
    refreshData: () => {
      fetchClients();
      fetchOrders();
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de AppProvider');
  return context;
};