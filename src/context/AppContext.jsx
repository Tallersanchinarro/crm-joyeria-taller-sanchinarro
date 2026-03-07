import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Datos iniciales de ejemplo
const initialOrders = [
  {
    id: 'ORD-001',
    orderNumber: 'R-2403-001',
    clientId: 'CLI-001',
    clientName: 'María García',
    clientPhone: '+34 612 345 678',
    clientEmail: 'maria@email.com',
    itemType: 'Anillo',
    material: 'Oro blanco 18k',
    description: 'La piedra está floja y necesita limpieza',
    observations: 'Anillo de compromiso, mucho valor sentimental',
    status: 'Recibido',
    budget: null,
    budgetStatus: 'pendiente',
    createdAt: '2024-03-01T10:30:00',
    photos: [],
    diagnosis: null,
    statusHistory: [
      {
        from: '',
        to: 'Recibido',
        date: '2024-03-01T10:30:00',
        note: 'Recepción inicial'
      }
    ]
  },
  {
    id: 'ORD-002',
    orderNumber: 'R-2403-002',
    clientId: 'CLI-002',
    clientName: 'Juan Pérez',
    clientPhone: '+34 623 456 789',
    clientEmail: 'juan@email.com',
    itemType: 'Collar',
    material: 'Plata 925',
    description: 'Cierre roto y cadena enredada',
    observations: 'Trajo solo el collar, sin colgante',
    status: 'En análisis',
    budget: null,
    budgetStatus: 'pendiente',
    createdAt: '2024-03-02T11:15:00',
    photos: [],
    diagnosis: {
      works: [
        { id: 1, description: 'Cambiar cierre', estimatedHours: 0.5 },
        { id: 2, description: 'Desenredar cadena', estimatedHours: 0.3 }
      ],
      materials: [
        { id: 1, name: 'Cierre de plata', quantity: 1, price: 12.50 }
      ],
      observations: 'El cierre original no se puede reparar'
    },
    statusHistory: [
      {
        from: '',
        to: 'Recibido',
        date: '2024-03-02T11:15:00',
        note: 'Recepción inicial'
      },
      {
        from: 'Recibido',
        to: 'En análisis',
        date: '2024-03-02T16:30:00',
        note: 'Pasa a taller para análisis'
      }
    ]
  },
  {
    id: 'ORD-003',
    orderNumber: 'R-2403-003',
    clientId: 'CLI-003',
    clientName: 'Ana López',
    clientPhone: '+34 634 567 890',
    clientEmail: 'ana@email.com',
    itemType: 'Pendientes',
    material: 'Oro amarillo 18k',
    description: 'Un pendiente perdió la piedra',
    observations: 'Son pendientes de novia',
    status: 'Presupuestado',
    budget: 145.00,
    budgetLabor: 80.00,
    budgetMaterials: 65.00,
    budgetStatus: 'pendiente',
    budgetNotes: 'Incluye piedra nueva y engarce',
    budgetDate: '2024-03-03T09:45:00',
    createdAt: '2024-03-02T12:30:00',
    photos: [],
    diagnosis: {
      works: [
        { id: 1, description: 'Reengarzar piedra', estimatedHours: 1.5 }
      ],
      materials: [
        { id: 1, name: 'Zirconia blanca', quantity: 1, price: 45.00 }
      ],
      observations: 'La piedra original no se encontró'
    },
    statusHistory: [
      {
        from: '',
        to: 'Recibido',
        date: '2024-03-02T12:30:00',
        note: 'Recepción inicial'
      },
      {
        from: 'Recibido',
        to: 'En análisis',
        date: '2024-03-02T15:20:00',
        note: 'Pasa a análisis'
      },
      {
        from: 'En análisis',
        to: 'Presupuestado',
        date: '2024-03-03T09:45:00',
        note: 'Presupuesto enviado al cliente'
      }
    ]
  },
  {
    id: 'ORD-004',
    orderNumber: 'R-2403-004',
    clientId: 'CLI-001',
    clientName: 'María García',
    clientPhone: '+34 612 345 678',
    clientEmail: 'maria@email.com',
    itemType: 'Pulsera',
    material: 'Oro rosa 18k',
    description: 'Eslabón roto',
    observations: 'Pulsera de la abuela',
    status: 'Aceptado',
    budget: 95.00,
    budgetLabor: 60.00,
    budgetMaterials: 35.00,
    budgetStatus: 'aceptado',
    budgetDate: '2024-03-01T11:20:00',
    createdAt: '2024-02-28T17:45:00',
    photos: [],
    diagnosis: {
      works: [
        { id: 1, description: 'Soldar eslabón', estimatedHours: 1.0 }
      ],
      materials: [
        { id: 1, name: 'Oro para soldadura', quantity: 1, price: 35.00 }
      ],
      observations: 'Se puede soldar, quedará como nuevo'
    },
    statusHistory: [
      {
        from: '',
        to: 'Recibido',
        date: '2024-02-28T17:45:00',
        note: 'Recepción inicial'
      },
      {
        from: 'Recibido',
        to: 'En análisis',
        date: '2024-02-29T10:15:00',
        note: 'Pasa a análisis'
      },
      {
        from: 'En análisis',
        to: 'Presupuestado',
        date: '2024-03-01T11:20:00',
        note: 'Presupuesto enviado'
      },
      {
        from: 'Presupuestado',
        to: 'Aceptado',
        date: '2024-03-01T16:40:00',
        note: 'Cliente acepta presupuesto'
      }
    ]
  },
  {
    id: 'ORD-005',
    orderNumber: 'R-2403-005',
    clientId: 'CLI-004',
    clientName: 'Carlos Ruiz',
    clientPhone: '+34 645 678 901',
    clientEmail: 'carlos@email.com',
    itemType: 'Reloj',
    material: 'Acero inoxidable',
    description: 'No funciona, necesita revisión',
    observations: 'Reloj heredado',
    status: 'En reparación',
    budget: 120.00,
    budgetLabor: 90.00,
    budgetMaterials: 30.00,
    budgetStatus: 'aceptado',
    budgetDate: '2024-02-28T12:30:00',
    createdAt: '2024-02-27T09:20:00',
    photos: [],
    diagnosis: {
      works: [
        { id: 1, description: 'Revisión mecanismo', estimatedHours: 2.0 },
        { id: 2, description: 'Cambio de pila', estimatedHours: 0.2 }
      ],
      materials: [
        { id: 1, name: 'Pila Renata', quantity: 1, price: 8.50 },
        { id: 2, name: 'Aceite para reloj', quantity: 1, price: 21.50 }
      ],
      observations: 'El mecanismo está sucio, necesita limpieza'
    },
    statusHistory: [
      {
        from: '',
        to: 'Recibido',
        date: '2024-02-27T09:20:00',
        note: 'Recepción inicial'
      },
      {
        from: 'Recibido',
        to: 'En análisis',
        date: '2024-02-27T15:30:00',
        note: 'Pasa a análisis'
      },
      {
        from: 'En análisis',
        to: 'Presupuestado',
        date: '2024-02-28T12:30:00',
        note: 'Presupuesto enviado'
      },
      {
        from: 'Presupuestado',
        to: 'Aceptado',
        date: '2024-02-28T17:20:00',
        note: 'Cliente acepta'
      },
      {
        from: 'Aceptado',
        to: 'En reparación',
        date: '2024-02-29T10:00:00',
        note: 'Inicia reparación'
      }
    ]
  },
  {
    id: 'ORD-006',
    orderNumber: 'R-2403-006',
    clientId: 'CLI-005',
    clientName: 'Laura Martínez',
    clientPhone: '+34 656 789 012',
    clientEmail: 'laura@email.com',
    itemType: 'Anillo',
    material: 'Platino',
    description: 'Grabado de iniciales',
    observations: 'Quiere "LM" en el interior',
    status: 'Listo',
    budget: 65.00,
    budgetLabor: 65.00,
    budgetMaterials: 0,
    budgetStatus: 'aceptado',
    budgetDate: '2024-02-26T10:15:00',
    createdAt: '2024-02-25T11:30:00',
    completedAt: '2024-02-28T16:20:00',
    photos: [],
    diagnosis: {
      works: [
        { id: 1, description: 'Grabado láser iniciales', estimatedHours: 0.5 }
      ],
      materials: [],
      observations: 'Grabado limpio, tipografía clásica'
    },
    statusHistory: [
      {
        from: '',
        to: 'Recibido',
        date: '2024-02-25T11:30:00',
        note: 'Recepción inicial'
      },
      {
        from: 'Recibido',
        to: 'En análisis',
        date: '2024-02-25T16:45:00',
        note: 'Pasa a análisis'
      },
      {
        from: 'En análisis',
        to: 'Presupuestado',
        date: '2024-02-26T10:15:00',
        note: 'Presupuesto enviado'
      },
      {
        from: 'Presupuestado',
        to: 'Aceptado',
        date: '2024-02-26T12:30:00',
        note: 'Cliente acepta'
      },
      {
        from: 'Aceptado',
        to: 'En reparación',
        date: '2024-02-26T15:00:00',
        note: 'Inicia trabajo'
      },
      {
        from: 'En reparación',
        to: 'Listo',
        date: '2024-02-28T16:20:00',
        note: 'Trabajo finalizado'
      }
    ]
  }
];

const initialClients = [
  {
    id: 'CLI-001',
    name: 'María García',
    phone: '+34 612 345 678',
    email: 'maria@email.com',
    address: 'Calle Mayor 123, Madrid',
    notes: 'Cliente VIP, prefiere oro blanco',
    createdAt: '2024-01-15T10:00:00',
    totalOrders: 2
  },
  {
    id: 'CLI-002',
    name: 'Juan Pérez',
    phone: '+34 623 456 789',
    email: 'juan@email.com',
    address: 'Av. Diagonal 456, Barcelona',
    notes: 'Siempre pide presupuesto primero',
    createdAt: '2024-01-20T11:30:00',
    totalOrders: 1
  },
  {
    id: 'CLI-003',
    name: 'Ana López',
    phone: '+34 634 567 890',
    email: 'ana@email.com',
    address: 'Plaza Nueva 78, Sevilla',
    notes: 'Colecciona joyas vintage',
    createdAt: '2024-02-01T09:15:00',
    totalOrders: 1
  },
  {
    id: 'CLI-004',
    name: 'Carlos Ruiz',
    phone: '+34 645 678 901',
    email: 'carlos@email.com',
    address: 'Calle de la Paz 34, Valencia',
    notes: 'Solo trae relojes',
    createdAt: '2024-02-10T16:45:00',
    totalOrders: 1
  },
  {
    id: 'CLI-005',
    name: 'Laura Martínez',
    phone: '+34 656 789 012',
    email: 'laura@email.com',
    address: 'Rambla Catalunya 89, Barcelona',
    notes: 'Cliente habitual',
    createdAt: '2024-02-20T12:00:00',
    totalOrders: 1
  }
];

export function AppProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('orfebre_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('orfebre_clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [loading, setLoading] = useState(false);

  // Guardar en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('orfebre_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('orfebre_clients', JSON.stringify(clients));
  }, [clients]);

  // Crear nueva orden
  const createOrder = (orderData) => {
    const newOrder = {
      id: `ORD-${Date.now()}`,
      ...orderData,
      statusHistory: [
        {
          from: '',
          to: orderData.status || 'Recibido',
          date: new Date().toISOString(),
          note: 'Recepción inicial'
        }
      ]
    };
    setOrders(prev => [...prev, newOrder]);
    
    // Actualizar contador del cliente
    setClients(prev => prev.map(client => 
      client.id === orderData.clientId 
        ? { ...client, totalOrders: (client.totalOrders || 0) + 1 }
        : client
    ));
    
    return newOrder;
  };

  // Actualizar orden
  const updateOrder = (orderId, updates) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, ...updates }
        : order
    ));
  };

  // Crear cliente
  const createClient = (clientData) => {
    const newClient = {
      id: `CLI-${Date.now()}`,
      ...clientData,
      totalOrders: 0
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  // Actualizar cliente
  const updateClient = (clientId, updates) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, ...updates }
        : client
    ));
  };

  // Obtener estadísticas
  const getStats = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return {
      activeOrders: orders.filter(o => 
        o.status !== 'Entregado' && 
        o.status !== 'Rechazado' && 
        o.status !== 'Archivado'
      ).length,
      newClients: clients.filter(c => {
        const clientDate = new Date(c.createdAt);
        return clientDate.getMonth() === thisMonth && 
               clientDate.getFullYear() === thisYear;
      }).length,
      monthlyRevenue: orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.getMonth() === thisMonth && 
                 orderDate.getFullYear() === thisYear &&
                 o.status === 'Entregado';
        })
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
    createOrder,
    updateOrder,
    createClient,
    updateClient,
    getStats
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};