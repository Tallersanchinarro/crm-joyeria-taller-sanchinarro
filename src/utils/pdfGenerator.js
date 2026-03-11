// Función específica para resguardo de recepción
export function generateReceptionPDF(order, client, type = 'cliente') {
  const shopName = 'Taller Relojería El Corte Ingles de Sanchinarro';
  const shopAddress = 'Calle Margarita de Parma 1';
  const shopPhone = '+34 672373275';
  const shopEmail = 'tallersanchinarro@rubiorelojeros.com';
  const shopCIF = 'B-88615489';

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const title = type === 'cliente' 
    ? 'RESGUARDO DE RECEPCIÓN - COPIA CLIENTE' 
    : 'RESGUARDO DE RECEPCIÓN - COPIA TALLER';

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resguardo de Recepción - ${order.order_number}</title>
      <style>
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          margin: 0;
          padding: 25px;
          color: #333;
          position: relative;
          min-height: 100vh;
        }
        
        /* MARCA DE AGUA MÁS CLARA */
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          font-weight: bold;
          opacity: 0.2; /* Reducido de 0.1 a 0.03 */
          color: ${type === 'cliente' ? '#0d9488' : '#dc2626'};
          pointer-events: none;
          z-index: -1;
          white-space: nowrap;
          text-transform: uppercase;
        }
        
        /* NÚMERO DE ORDEN EN GRANDE */
        .order-number-box {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px solid #0d9488;
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0 30px 0;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .order-number-label {
          font-size: 12px;
          color: #0d9488;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        
        .order-number {
          font-size: 20px;
          font-weight: 800;
          color: #0d9488;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0d9488;
        }
        .logo-area {
          flex: 1;
        }
        .logo-area img {
          max-height: 60px;
          max-width: 200px;
        }
        .shop-info {
          flex: 2;
          text-align: right;
        }
        .shop-name {
          font-size: 20px;
          font-weight: bold;
          color: #0d9488;
          margin: 0 0 5px 0;
        }
        .shop-detail {
          font-size: 11px;
          color: #666;
          margin: 2px 0;
        }
        .title {
          font-size: 16px;
          font-weight: bold;
          color: ${type === 'cliente' ? '#0d9488' : '#dc2626'};
          margin: 20px 0;
          text-align: center;
          text-transform: uppercase;
          background: #f5f5f5;
          padding: 8px;
          border-radius: 5px;
        }
        .document-number {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-box {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          background: #f9f9f9;
        }
        .info-box h3 {
          margin: 0 0 10px 0;
          color: #0d9488;
          font-size: 14px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .info-row {
          margin: 5px 0;
          font-size: 12px;
        }
        .label {
          font-weight: bold;
          color: #555;
          display: inline-block;
          width: 100px;
        }
        .jewelry-details {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
        }
        .jewelry-details h3 {
          margin: 0 0 10px 0;
          color: #0d9488;
          font-size: 14px;
        }
        .description-box {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          font-size: 13px;
          margin: 10px 0;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
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
          font-size: 11px;
        }
        .badge {
          background: ${type === 'cliente' ? '#0d9488' : '#dc2626'};
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          display: inline-block;
          margin-bottom: 15px;
        }
        .observations {
          background: #fff3cd;
          border: 1px solid #ffeeba;
          padding: 10px;
          border-radius: 5px;
          font-size: 11px;
          margin-top: 15px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .watermark { opacity: 0.02; }
        }
      </style>
    </head>
    <body>
      <!-- MARCA DE AGUA MÁS CLARA -->
      <div class="watermark">
        ${type === 'cliente' ? 'CLIENTE' : 'TALLER'}
      </div>

      <!-- NÚMERO DE ORDEN EN GRANDE -->
      <div class="order-number-box">
        <div class="order-number-label">Nº DE RECEPCIÓN</div>
        <div class="order-number">${order.order_number}</div>
      </div>

      <div class="document-number">
        Fecha: ${formatDate(order.created_at)}
      </div>

      <!-- HEADER CON LOGO -->
      <div class="header">
        <div class="logo-area">
          <img src="/logo-taller.png" alt="Logo del taller" onerror="this.style.display='none'">
        </div>
        <div class="shop-info">
          <p class="shop-name">${shopName}</p>
          <p class="shop-detail">${shopAddress}</p>
          <p class="shop-detail">Tel: ${shopPhone} | Email: ${shopEmail}</p>
          <p class="shop-detail">CIF: ${shopCIF}</p>
        </div>
      </div>

      <div class="badge">
        ${title}
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>DATOS DEL CLIENTE</h3>
          <div class="info-row"><span class="label">Nombre:</span> ${client.name}</div>
          <div class="info-row"><span class="label">Teléfono:</span> ${client.phone}</div>
          ${client.email ? `<div class="info-row"><span class="label">Email:</span> ${client.email}</div>` : ''}
        </div>
        
        <div class="info-box">
          <h3>DATOS DE LA JOYA</h3>
          <div class="info-row"><span class="label">Tipo:</span> ${order.item_type || 'No especificado'}</div>
          <div class="info-row"><span class="label">Material:</span> ${order.material || 'No especificado'}</div>
        </div>
      </div>

      <div class="jewelry-details">
        <h3>DESCRIPCIÓN DEL PROBLEMA</h3>
        <div class="description-box">
          ${order.description || 'No se especificó'}
        </div>
        
        ${order.observations ? `
          <h3 style="margin-top: 20px;">OBSERVACIONES</h3>
          <div class="description-box" style="background: #fff3cd;">
            ${order.observations}
          </div>
        ` : ''}
      </div>

      <div style="margin-bottom: 30px;">
        <p style="font-size: 12px; color: #666;">
          <strong>Nota:</strong> La joya queda en el taller para su análisis. 
          Se generará un presupuesto que será comunicado al cliente.
        </p>
      </div>

      <!-- FIRMAS -->
      <div class="signature">
        <div class="signature-box">
          <div class="signature-line">Firma del cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Firma del taller</div>
          <p style="font-size: 10px; margin-top: 5px;">${shopName}</p>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado por OrfebreCRM el ${new Date().toLocaleDateString()}</p>
        <p>${shopName} - ${shopEmail}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}