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