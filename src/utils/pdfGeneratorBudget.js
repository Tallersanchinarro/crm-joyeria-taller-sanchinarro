import { supabase } from '../lib/supabaseClient';

// Datos de la empresa (por defecto)
let EMPRESA = {
  nombre: 'LAM-RELOJEROS S.L',
  cif: 'B-88615489',
  telefono: '672373275',
  email: 'info@lam-relojeros.com',
  direccion: 'C/ Ejemplo, 123',
  ciudad: '28001 Madrid'
};

let LOGO_URL = '/logo-taller.png';
let IVA_PORCENTAJE = 21;

/**
 * Carga la configuración de la empresa desde Supabase
 */
async function cargarConfiguracion() {
  try {
    const { data: config, error } = await supabase
      .from('configuracion')
      .select('*')
      .single();

    if (error) throw error;

    if (config) {
      if (config.empresa) {
        EMPRESA = { ...EMPRESA, ...config.empresa };
      }
      if (config.impuestos?.iva) {
        IVA_PORCENTAJE = config.impuestos.iva;
      }
      if (config.logo_url) {
        LOGO_URL = config.logo_url;
      }
    }
  } catch (error) {
    console.log('Usando configuración por defecto');
  }
}

/**
 * Genera un PDF profesional del presupuesto (HTML + print)
 */
export const generateBudgetPDF = async (order, client, descuento = 0, descuentoTipo = 'porcentaje', notas = '') => {
  await cargarConfiguracion();

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calcular totales
  const trabajosTotal = (order.trabajos || []).reduce((sum, t) => sum + (t.total || t.tarifa_aplicada * (t.cantidad || 1) || 0), 0);
  const fallosTotal = (order.fallos || []).reduce((sum, f) => sum + (f.total || 0), 0);
  const subtotalConIVA = trabajosTotal + fallosTotal;
  
  let descuentoAplicado = 0;
  if (descuento > 0) {
    if (descuentoTipo === 'porcentaje') {
      descuentoAplicado = subtotalConIVA * (descuento / 100);
    } else {
      descuentoAplicado = Math.min(descuento, subtotalConIVA);
    }
  }
  
  const totalConIVA = subtotalConIVA - descuentoAplicado;
  const baseImponible = totalConIVA / (1 + IVA_PORCENTAJE / 100);
  const iva = totalConIVA - baseImponible;

  const fechaEmision = formatDate(new Date());
  const fechaValidez = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Presupuesto - ${order.order_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          background: white;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0b35a;
        }
        .logo-area img {
          max-height: 80px;
          max-width: 200px;
        }
        .title-area {
          text-align: right;
        }
        .title-area h1 {
          font-size: 32px;
          color: #e0b35a;
          margin-bottom: 10px;
        }
        .doc-number {
          font-size: 12px;
          color: #666;
        }
        .data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .data-box {
          border: 1px solid #eee;
          padding: 15px;
          border-radius: 8px;
          background: #fafafa;
        }
        .data-box h3 {
          font-size: 14px;
          color: #e0b35a;
          margin-bottom: 12px;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        .data-row {
          font-size: 12px;
          margin: 8px 0;
        }
        .data-label {
          font-weight: bold;
          color: #555;
          display: inline-block;
          width: 80px;
        }
        .concepto {
          margin-bottom: 25px;
        }
        .concepto h3 {
          font-size: 14px;
          color: #e0b35a;
          margin-bottom: 8px;
        }
        .concepto-text {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 5px;
          font-size: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 8px 10px;
          font-size: 11px;
          border-bottom: 1px solid #eee;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totales {
          margin-top: 20px;
          text-align: right;
        }
        .totales-box {
          display: inline-block;
          background: #fafafa;
          padding: 15px 25px;
          border-radius: 8px;
          border: 1px solid #e0b35a;
          min-width: 250px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 12px;
        }
        .total-row strong {
          font-size: 16px;
          color: #e0b35a;
        }
        .separator {
          border-top: 1px solid #ddd;
          margin: 10px 0;
        }
        .notas {
          margin: 30px 0;
          background: #fff8e8;
          padding: 12px;
          border-radius: 5px;
          font-size: 11px;
          border-left: 3px solid #e0b35a;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 9px;
          color: #999;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-area">
            <img src="${LOGO_URL}" alt="Logo" onerror="this.style.display='none'">
          </div>
          <div class="title-area">
            <h1>PRESUPUESTO</h1>
            <div class="doc-number">Nº ${order.order_number || order.id.slice(-8)}</div>
            <div class="doc-number">Fecha: ${fechaEmision}</div>
            <div class="doc-number">Válido hasta: ${fechaValidez}</div>
          </div>
        </div>

        <div class="data-grid">
          <div class="data-box">
            <h3>TALLER</h3>
            <div class="data-row"><span class="data-label">Nombre:</span> ${EMPRESA.nombre}</div>
            <div class="data-row"><span class="data-label">Dirección:</span> ${EMPRESA.direccion}</div>
            <div class="data-row"><span class="data-label">Ciudad:</span> ${EMPRESA.ciudad}</div>
            <div class="data-row"><span class="data-label">CIF:</span> ${EMPRESA.cif}</div>
            <div class="data-row"><span class="data-label">Teléfono:</span> ${EMPRESA.telefono}</div>
            <div class="data-row"><span class="data-label">Email:</span> ${EMPRESA.email}</div>
          </div>
          <div class="data-box">
            <h3>CLIENTE</h3>
            <div class="data-row"><span class="data-label">Nombre:</span> ${client.name}</div>
            <div class="data-row"><span class="data-label">Teléfono:</span> ${client.phone}</div>
            ${client.email ? `<div class="data-row"><span class="data-label">Email:</span> ${client.email}</div>` : ''}
            ${client.address ? `<div class="data-row"><span class="data-label">Dirección:</span> ${client.address}</div>` : ''}
            ${client.nif ? `<div class="data-row"><span class="data-label">NIF:</span> ${client.nif}</div>` : ''}
          </div>
        </div>

        <div class="concepto">
          <h3>JOYA A REPARAR</h3>
          <div class="concepto-text">
            <strong>Tipo:</strong> ${order.item_type || 'No especificado'}<br>
            <strong>Material:</strong> ${order.material || 'No especificado'}<br>
            <strong>Descripción:</strong> ${order.description || 'Sin descripción'}<br>
            ${order.observations ? `<strong>Observaciones:</strong> ${order.observations}` : ''}
          </div>
        </div>

        ${order.trabajos?.length > 0 ? `
          <h3>TRABAJOS A REALIZAR</h3>
          <table>
            <thead>
              <tr><th>Trabajo</th><th class="text-center">Cant.</th><th class="text-right">Precio</th><th class="text-center">Dto.</th><th class="text-right">Importe</th></tr>
            </thead>
            <tbody>
              ${order.trabajos.map(t => `
                <tr>
                  <td>${t.nombre}</td>
                  <td class="text-center">${t.cantidad || 1}</td>
                  <td class="text-right">${(t.tarifa_aplicada || t.tarifa_base || 0).toFixed(2)} €</td>
                  <td class="text-center">${t.descuento ? `${t.descuento}%` : '—'}</td>
                  <td class="text-right">${(t.total || 0).toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${order.fallos?.length > 0 ? `
          <h3>FALLOS DETECTADOS</h3>
          <table>
            <thead><tr><th>Fallo</th><th>Gravedad</th><th>Observaciones</th></tr></thead>
            <tbody>
              ${order.fallos.map(f => `
                <tr>
                  <td>${f.nombre}</td>
                  <td>${f.gravedad?.charAt(0).toUpperCase() + f.gravedad?.slice(1) || 'Media'}</td>
                  <td>${f.observaciones || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="totales">
          <div class="totales-box">
            <div class="total-row"><span>Subtotal:</span><span>${subtotalConIVA.toFixed(2)} €</span></div>
            ${descuentoAplicado > 0 ? `<div class="total-row"><span>Descuento:</span><span>- ${descuentoAplicado.toFixed(2)} €</span></div>` : ''}
            <div class="total-row"><span>Base imponible:</span><span>${baseImponible.toFixed(2)} €</span></div>
            <div class="total-row"><span>IVA (${IVA_PORCENTAJE}%):</span><span>${iva.toFixed(2)} €</span></div>
            <div class="separator"></div>
            <div class="total-row"><strong>TOTAL:</strong><strong>${totalConIVA.toFixed(2)} €</strong></div>
          </div>
        </div>

        ${notas || order.budget_notes ? `
          <div class="notas">
            <strong>NOTAS:</strong><br>${notas || order.budget_notes}
          </div>
        ` : ''}

        <div class="footer">
          <p>Este presupuesto tiene una validez de 30 días. Los precios incluyen IVA.</p>
          <p>${EMPRESA.nombre} · ${EMPRESA.telefono} · ${EMPRESA.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
};