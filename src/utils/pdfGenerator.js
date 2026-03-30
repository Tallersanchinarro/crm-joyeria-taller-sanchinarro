import { supabase } from '../lib/supabaseClient';

// Función específica para resguardo de recepción
export async function generateReceptionPDF(order, client, type = 'cliente') {
  // Cargar configuración para obtener la URL del logo
  let logoUrl = '/logo-taller.png';
  let shopName = 'LAM-RELOJEROS S.L';
  let shopAddress = 'C/ Margarita de Parma 1 Madrid';
  let ShopPostalcode = '28050';
  let shopPhone = '672373275';
  let shopEmail = 'tallersanchinarrro@rubiorelojeros.com';
  let shopCIF = 'B-88615489';

  try {
    const { data: config, error } = await supabase
      .from('configuracion')
      .select('*')
      .single();

    if (!error && config) {
      if (config.logo_url) {
        logoUrl = config.logo_url;
      }
      if (config.empresa) {
        shopName = config.empresa.nombre || shopName;
        shopAddress = config.empresa.direccion || shopAddress;
        shopPhone = config.empresa.telefono || shopPhone;
        shopEmail = config.empresa.email || shopEmail;
        shopCIF = config.empresa.cif || shopCIF;
        ShopPostalcode = config.empresa.postalcode || ShopPostalcode;
      }
    }
  } catch (error) {
    console.log('Usando datos por defecto');
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const title = type === 'cliente' 
    ? 'COPIA CLIENTE' 
    : 'RESGUARDO DE RECEPCIÓN - COPIA TALLER';

  // Marca de agua profesional
  const watermarkText = type === 'cliente' ? 'COPIA CLIENTE' : 'COPIA TALLER';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resguardo de Recepción - ${order.order_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          background: white;
          padding: 20px;
          color: #333;
          position: relative;
          margin-top: 50px;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        
        /* MARCA DE AGUA PROFESIONAL */
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 70px;
          font-weight: bold;
          color: rgba(200, 200, 200, 0.9);
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
          font-family: 'Helvetica', Arial, sans-serif;
          letter-spacing: 5px;
        }
        
        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .logo-area img {
          max-height: 120px;
          max-width: 240px;
        }
        .title-area {
          text-align: right;
        }
        .title-area h1 {
          font-size: 20px;
          color: #333;
          margin-bottom: 8px;
        }
        .doc-number {
          font-size: 15px;
          color: #666;
          margin: 2px 0;
        }
        
        /* DATOS */
        .data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .data-box {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          background: #fafafa;
        }
        .data-box h3 {
          font-size: 13px;
          color: #333;
          margin-bottom: 12px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .data-row {
          font-size: 11px;
          margin: 6px 0;
        }
        .data-label {
          font-weight: bold;
          color: #555;
          display: inline-block;
          width: 75px;
        }
        
        /* JOYA */
        .joya-section {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        .joya-header {
          background: #f5f5f5;
          padding: 10px 15px;
          border-bottom: 1px solid #ddd;
        }
        .joya-header h3 {
          font-size: 13px;
          color: #333;
        }
        .joya-content {
          padding: 15px;
        }
        .joya-row {
          margin: 8px 0;
          font-size: 11px;
        }
        .description-box {
          background: #f9f9f9;
          padding: 10px;
          border-radius: 5px;
          margin-top: 8px;
          font-size: 11px;
          line-height: 1.4;
        }
        
        /* NOTAS */
        .notas {
          margin: 20px 0;
          padding: 10px;
          background: #f9f9f9;
          border-left: 3px solid #333;
          font-size: 10px;
          color: #666;
        }
        
        /* FIRMAS */
        .signature {
          margin-top: 50px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .signature-box {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 30px;
          padding-top: 5px;
          font-size: 10px;
        }
        
        /* PIE */
        .footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        
        @media print {
          body { padding: 0; }
          .watermark { opacity: 0.2; }
        }
      </style>
    </head>
    <body>
      <!-- MARCA DE AGUA PROFESIONAL -->
      <div class="watermark">${watermarkText}</div>
      
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo-area">
            <img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'">
          </div>
          <div class="title-area">
            <h1>RESGUARDO DE RECEPCIÓN</h1>
            <div class="doc-number">Nº ${order.order_number}</div>
            <div class="doc-number">Fecha: ${formatDate(order.created_at)}</div>
            <div class="doc-number">${title}</div>
          </div>
        </div>

        <!-- DATOS -->
        <div class="data-grid">
          <div class="data-box">
            <h3>DATOS DEL CLIENTE</h3>
            <div class="data-row"><span class="data-label">Nombre:</span> ${client.name}</div>
            <div class="data-row"><span class="data-label">Teléfono:</span> ${client.phone}</div>
            ${client.email ? `<div class="data-row"><span class="data-label">Email:</span> ${client.email}</div>` : ''}
            ${client.nif ? `<div class="data-row"><span class="data-label">NIF:</span> ${client.nif}</div>` : ''}
          </div>
          <div class="data-box">
            <h3>DATOS DEL TALLER</h3>
            <div class="data-row"><span class="data-label">Nombre:</span> ${shopName}</div>
            <div class="data-row"><span class="data-label">Dirección:</span> ${shopAddress}</div>
            <div class="data-row"><span class="data-label">C.P.:</span> ${ShopPostalcode}</div>
            <div class="data-row"><span class="data-label">Teléfono:</span> ${shopPhone}</div>
            <div class="data-row"><span class="data-label">Email:</span> ${shopEmail}</div>
            <div class="data-row"><span class="data-label">CIF:</span> ${shopCIF}</div>
          </div>
        </div>

        <!-- JOYA -->
        <div class="joya-section">
          <div class="joya-header">
            <h3>JOYA RECIBIDA</h3>
          </div>
          <div class="joya-content">
            <div class="joya-row"><strong>Tipo:</strong> ${order.item_type || 'No especificado'}</div>
            <div class="joya-row"><strong>Material:</strong> ${order.material || 'No especificado'}</div>
            <div class="joya-row"><strong>Descripción del problema:</strong></div>
            <div class="description-box">
              ${order.description || 'No se especificó'}
            </div>
            ${order.observations ? `
              <div class="joya-row" style="margin-top: 12px;"><strong>Observaciones:</strong></div>
              <div class="description-box" style="background: #f9f9f9;">
                ${order.observations}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- NOTAS -->
        <div class="notas">
          <strong>Nota:</strong> La joya queda en el taller para su análisis y presupuesto. 
          Se generará un presupuesto que será comunicado al cliente para su aprobación antes de iniciar cualquier reparación.
        </div>

        <!-- FIRMAS -->
        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">Firma del cliente</div>
            <p style="font-size: 9px; margin-top: 5px;">${formatDate(new Date())}</p>
          </div>
          <div class="signature-box">
            <div class="signature-line">Firma del taller</div>
            <p style="font-size: 9px; margin-top: 5px;">${shopName}</p>
          </div>
        </div>

        <div class="footer">
          <p>Documento generado por LAMRelojeros el ${formatDate(new Date())}</p>
          <p>${shopName} · ${shopPhone} · ${shopEmail}</p>
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
}