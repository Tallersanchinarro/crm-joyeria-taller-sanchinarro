// Función para generar PDF del presupuesto/recibo
export function generateOrderPDF(order, client, shopSettings, isDepositOnly = false) {
  // Crear el contenido del PDF como HTML
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${isDepositOnly ? 'Recibo de Depósito' : 'Presupuesto'} - OrfebreCRM</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0d9488;
        }
        .shop-name {
          font-size: 24px;
          font-weight: bold;
          color: #0d9488;
          margin: 0;
        }
        .shop-info {
          font-size: 12px;
          color: #666;
          margin: 5px 0;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 20px 0;
          text-align: center;
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
          border-radius: 5px;
        }
        .info-box h3 {
          margin: 0 0 10px 0;
          color: #0d9488;
          font-size: 14px;
        }
        .info-row {
          margin: 5px 0;
          font-size: 12px;
        }
        .label {
          font-weight: bold;
          color: #666;
        }
        .order-details {
          margin-bottom: 30px;
        }
        .order-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .order-details th {
          background: #0d9488;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 12px;
        }
        .order-details td {
          padding: 10px;
          border: 1px solid #ddd;
          font-size: 12px;
        }
        .total-box {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          text-align: right;
        }
        .total-row {
          font-size: 14px;
          margin: 5px 0;
        }
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #0d9488;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #ddd;
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
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 30px;
          padding-top: 5px;
          font-size: 10px;
          text-align: center;
        }
        .badge {
          background: #0d9488;
          color: white;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 10px;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="shop-name">${shopSettings.shopName}</h1>
        <p class="shop-info">${shopSettings.shopAddress}</p>
        <p class="shop-info">Tel: ${shopSettings.shopPhone} | Email: ${shopSettings.shopEmail}</p>
        <p class="shop-info">CIF: ${shopSettings.shopCIF}</p>
      </div>

      <h2 class="title">${isDepositOnly ? 'RECIBO DE DEPÓSITO' : 'PRESUPUESTO DE REPARACIÓN'}</h2>
      
      <div class="info-grid">
        <div class="info-box">
          <h3>DATOS DEL CLIENTE</h3>
          <div class="info-row"><span class="label">Nombre:</span> ${client.name}</div>
          <div class="info-row"><span class="label">Teléfono:</span> ${client.phone}</div>
          ${client.email ? `<div class="info-row"><span class="label">Email:</span> ${client.email}</div>` : ''}
          ${client.address ? `<div class="info-row"><span class="label">Dirección:</span> ${client.address}</div>` : ''}
        </div>
        
        <div class="info-box">
          <h3>DATOS DE LA REPARACIÓN</h3>
          <div class="info-row"><span class="label">Nº Orden:</span> ${order.orderNumber}</div>
          <div class="info-row"><span class="label">Fecha:</span> ${new Date(order.createdAt).toLocaleDateString()}</div>
          <div class="info-row"><span class="label">Estado:</span> ${order.status}</div>
          <div class="info-row"><span class="label">Prioridad:</span> ${order.priority}</div>
        </div>
      </div>

      <div class="order-details">
        <table>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Tipo</th>
              <th>Material</th>
              <th>Descripción del trabajo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${order.item}</td>
              <td>${order.itemType || 'Joya'}</td>
              <td>${order.material || 'No especificado'}</td>
              <td>${order.description}</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${order.observations ? `
        <div class="info-box" style="margin-bottom: 20px;">
          <h3>OBSERVACIONES</h3>
          <p style="font-size: 12px;">${order.observations}</p>
        </div>
      ` : ''}

      <div class="total-box">
        <div class="total-row">
          <span class="label">Presupuesto total:</span>
          <span style="float: right;">${order.budget.toFixed(2)} €</span>
        </div>
        ${isDepositOnly ? `
          <div class="total-row">
            <span class="label">Seña/Depósito:</span>
            <span style="float: right; color: #0d9488; font-weight: bold;">${order.deposit.toFixed(2)} €</span>
          </div>
          <div class="total-row">
            <span class="label">Resto a pagar:</span>
            <span style="float: right;">${(order.budget - order.deposit).toFixed(2)} €</span>
          </div>
          <div class="grand-total">
            <span>Total pagado hoy:</span>
            <span style="float: right;">${order.deposit.toFixed(2)} €</span>
          </div>
        ` : `
          <div class="grand-total">
            <span>TOTAL PRESUPUESTO:</span>
            <span style="float: right;">${order.budget.toFixed(2)} €</span>
          </div>
        `}
      </div>

      <div style="margin-top: 20px;">
        <span class="badge">${isDepositOnly ? 'DEPÓSITO CONFIRMADO' : 'PRESUPUESTO VÁLIDO POR 7 DÍAS'}</span>
      </div>

      <div class="signature">
        <div>
          <p class="signature-line">Firma del cliente</p>
        </div>
        <div>
          <p class="signature-line">Firma del taller</p>
        </div>
      </div>

      <div class="footer">
        <p>Este documento no es una factura. ${isDepositOnly ? 'El depósito no es reembolsable una vez iniciada la reparación.' : 'Presupuesto sujeto a aceptación del cliente.'}</p>
        <p>Documento generado por OrfebreCRM - Gestión para Talleres de Joyería</p>
      </div>
    </body>
    </html>
  `;

  // Abrir ventana de impresión
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Llamar a la función de impresión después de que el contenido cargue
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

// Función específica para resguardo de recepción
export function generateReceptionPDF(order, client, type = 'cliente') {
  const shopName = 'OrfebreCRM Taller de Joyería';
  const shopAddress = 'Calle Principal 123';
  const shopPhone = '+34 912 345 678';
  const shopEmail = 'info@orfebrecrm.com';
  const shopCIF = 'B-12345678';

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
      <title>Resguardo de Recepción - ${order.orderNumber}</title>
      <style>
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0d9488;
        }
        .shop-name {
          font-size: 24px;
          font-weight: bold;
          color: #0d9488;
          margin: 0;
        }
        .shop-info {
          font-size: 12px;
          color: #666;
          margin: 3px 0;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          color: ${type === 'cliente' ? '#0d9488' : '#dc2626'};
          margin: 20px 0;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .document-number {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
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
          border-radius: 5px;
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
          border-radius: 5px;
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
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 10px;
          text-align: center;
        }
        .badge {
          background: ${type === 'cliente' ? '#0d9488' : '#dc2626'};
          color: white;
          padding: 5px 15px;
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
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          opacity: 0.1;
          color: ${type === 'cliente' ? '#0d9488' : '#dc2626'};
          pointer-events: none;
          z-index: -1;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .watermark { opacity: 0.05; }
        }
      </style>
    </head>
    <body>
      <div class="watermark">
        ${type === 'cliente' ? 'CLIENTE' : 'TALLER'}
      </div>

      <div class="document-number">
        Nº RECEPCIÓN: ${order.orderNumber}
      </div>

      <div class="header">
        <h1 class="shop-name">${shopName}</h1>
        <p class="shop-info">${shopAddress}</p>
        <p class="shop-info">Tel: ${shopPhone} | Email: ${shopEmail}</p>
        <p class="shop-info">CIF: ${shopCIF}</p>
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
          <div class="info-row"><span class="label">Fecha:</span> ${formatDate(order.createdAt)}</div>
        </div>
        
        <div class="info-box">
          <h3>DATOS DE LA JOYA</h3>
          <div class="info-row"><span class="label">Tipo:</span> ${order.itemType || 'No especificado'}</div>
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
          El plazo estimado de análisis es de 2-3 días hábiles.
        </p>
      </div>

      <div class="signature">
        <div>
          <p class="signature-line">Firma del cliente</p>
          <p style="font-size: 10px; text-align: center; margin-top: 5px;">Conforme con la recepción</p>
        </div>
        <div>
          <p class="signature-line">Firma del taller</p>
          <p style="font-size: 10px; text-align: center; margin-top: 5px;">Sello del establecimiento</p>
        </div>
      </div>

      <div class="footer">
        <p>Este documento acredita la recepción de la joya para su análisis.</p>
        <p>Documento generado por OrfebreCRM el ${new Date().toLocaleDateString()}</p>
        ${type === 'taller' ? '<p style="color: #dc2626;">COPIA PARA EL TALLER - CONSERVAR CON LA JOYA</p>' : ''}
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