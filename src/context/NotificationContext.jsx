import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const initialLoadDone = useRef(false);

  // Cargar estado leído de localStorage
  const getReadFromStorage = () => {
    try {
      const saved = localStorage.getItem('notifications_read');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      console.error('Error leyendo localStorage:', e);
      return new Set();
    }
  };

  const [readIds, setReadIds] = useState(getReadFromStorage);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('notifications_read', JSON.stringify([...readIds]));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }, [readIds]);

  // Cargar notificaciones iniciales (solo una vez)
  useEffect(() => {
    if (!initialLoadDone.current) {
      loadInitialNotifications();
      initialLoadDone.current = true;
    }

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('notificaciones')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'budget_tokens',
          filter: 'client_action=neq.null'
        },
        async (payload) => {
          // Ignorar notificaciones antiguas (más de 10 segundos)
          const actionTime = new Date(payload.new.action_date).getTime();
          const now = Date.now();
          if (now - actionTime > 10000) return;
          
          // Ignorar si ya la tenemos en readIds
          if (readIds.has(payload.new.id)) return;
          
          try {
            // Obtener información de la orden
            const { data: orderData, error } = await supabase
              .from('ordenes')
              .select(`
                id,
                order_number,
                item_type,
                budget,
                client_id,
                clientes (
                  name,
                  phone
                )
              `)
              .eq('id', payload.new.order_id)
              .single();

            if (error) throw error;

            const newNotification = {
              id: payload.new.id,
              type: payload.new.client_action === 'aceptado' ? 'success' : 'error',
              title: payload.new.client_action === 'aceptado' 
                ? '✅ Presupuesto aceptado' 
                : '❌ Presupuesto rechazado',
              message: `${orderData.clientes?.name} ha ${
                payload.new.client_action === 'aceptado' ? 'aceptado' : 'rechazado'
              } el presupuesto para ${orderData.item_type} (${orderData.budget}€)`,
              orderId: orderData.id,
              orderNumber: orderData.order_number,
              timestamp: payload.new.action_date,
              read: false
            };

            // Añadir notificación
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
          } catch (error) {
            console.error('Error procesando notificación:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Dependencias vacías

  // Cargar notificaciones existentes desde Supabase
  const loadInitialNotifications = async () => {
    try {
      setLoading(true);
      
      const { data: tokens, error } = await supabase
        .from('budget_tokens')
        .select(`
          id,
          client_action,
          action_date,
          order_id,
          ordenes (
            id,
            order_number,
            item_type,
            budget,
            client_id,
            clientes (
              name,
              phone
            )
          )
        `)
        .not('client_action', 'is', null)
        .order('action_date', { ascending: false })
        .limit(50); // Limitamos a 50 notificaciones

      if (error) throw error;

      if (tokens && tokens.length > 0) {
        // Formatear notificaciones
        const formattedNotifications = tokens.map(token => ({
          id: token.id,
          type: token.client_action === 'aceptado' ? 'success' : 'error',
          title: token.client_action === 'aceptado' 
            ? '✅ Presupuesto aceptado' 
            : '❌ Presupuesto rechazado',
          message: `${token.ordenes?.clientes?.name || 'Cliente'} ha ${
            token.client_action === 'aceptado' ? 'aceptado' : 'rechazado'
          } el presupuesto para ${token.ordenes?.item_type || 'la joya'} (${token.ordenes?.budget || 0}€)`,
          orderId: token.order_id,
          orderNumber: token.ordenes?.order_number,
          timestamp: token.action_date,
          // Si el ID está en readIds, está leída
          read: readIds.has(token.id)
        }));

        setNotifications(formattedNotifications);
        
        // Calcular no leídas (las que no están en readIds)
        const unread = formattedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar una notificación como leída
  const markAsRead = (id) => {
    setReadIds(prev => new Set(prev).add(id));
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marcar una notificación como no leída
  const markAsUnread = (id) => {
    setReadIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: false } : n)
    );
    setUnreadCount(prev => prev + 1);
  };

  // Marcar todas como leídas
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(prev => new Set([...prev, ...allIds]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAsUnread,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};