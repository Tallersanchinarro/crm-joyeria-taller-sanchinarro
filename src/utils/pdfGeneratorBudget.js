import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Datos de la empresa
const EMPRESA = {
  nombre: 'LAM-RELOJEROS S.L',
  cif: 'B-88615489',
  telefono: '672373275',
  email: 'info@lam-relojeros.com',
  direccion: 'C/ Ejemplo, 123',
  ciudad: '28001 Madrid'
};

const IVA_PORCENTAJE = 21;

/**
 * Genera un PDF profesional del presupuesto
 * @param {Object} order - Datos de la orden
 * @param {Object} client - Datos del cliente
 * @param {number} descuento - Descuento aplicado
 * @param {string} descuentoTipo - 'porcentaje' o 'euros'
 * @param {string} notas - Notas adicionales
 */
export const generateBudgetPDF = async (order, client, descuento = 0, descuentoTipo = 'porcentaje', notas = '') => {
  // Crear documento en formato A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Función auxiliar para dibujar línea
  const drawLine = (y, lineWidth = 0.5) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // ========== HEADER ==========
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(33, 33, 33);
  doc.text('PRESUPUESTO', margin, yPos);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Nº ${order.order_number || order.id.slice(-8)}`, margin, yPos + 7);
  
  // Fecha de emisión
  const fechaEmision = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${fechaEmision}`, pageWidth - margin - 40, yPos);
  doc.text(`Válido hasta: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}`, pageWidth - margin - 40, yPos + 7);
  
  yPos += 20;
  drawLine(yPos);
  yPos += 8;

  // ========== DATOS DE LA EMPRESA ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(33, 33, 33);
  doc.text('TALLER', margin, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(EMPRESA.nombre, margin, yPos + 5);
  doc.text(EMPRESA.direccion, margin, yPos + 10);
  doc.text(EMPRESA.ciudad, margin, yPos + 15);
  doc.text(`Tel: ${EMPRESA.telefono}`, margin, yPos + 20);
  doc.text(`CIF: ${EMPRESA.cif}`, margin, yPos + 25);
  
  // ========== DATOS DEL CLIENTE ==========
  const clientX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(33, 33, 33);
  doc.text('CLIENTE', clientX, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(client.name, clientX, yPos + 5);
  doc.text(`Tel: ${client.phone}`, clientX, yPos + 10);
  if (client.email) doc.text(`Email: ${client.email}`, clientX, yPos + 15);
  if (client.address) doc.text(client.address, clientX, yPos + 20);
  
  yPos += 40;
  drawLine(yPos);
  yPos += 8;

  // ========== DESCRIPCIÓN DE LA JOYA ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(33, 33, 33);
  doc.text('JOYA A REPARAR', margin, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Tipo: ${order.item_type || 'No especificado'}`, margin, yPos);
  doc.text(`Material: ${order.material || 'No especificado'}`, margin + 70, yPos);
  
  yPos += 5;
  doc.text(`Descripción: ${order.description || 'Sin descripción'}`, margin, yPos);
  
  if (order.observations) {
    yPos += 5;
    doc.text(`Observaciones: ${order.observations}`, margin, yPos);
  }
  
  yPos += 10;
  drawLine(yPos);
  yPos += 8;

  // ========== TRABAJOS A REALIZAR ==========
  if (order.trabajos && order.trabajos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(33, 33, 33);
    doc.text('TRABAJOS A REALIZAR', margin, yPos);
    yPos += 6;
    
    const trabajosTable = order.trabajos.map(t => [
      t.nombre,
      (t.cantidad || 1).toString(),
      `${(t.tarifa_aplicada || t.tarifa_base || 0).toFixed(2)} €`,
      t.descuento ? `${t.descuento}%` : '-',
      `${(t.total || 0).toFixed(2)} €`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Trabajo', 'Cant.', 'Precio', 'Dto.', 'Importe']],
      body: trabajosTable,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [33, 33, 33], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });
    
    yPos = doc.lastAutoTable.finalY + 8;
  }

  // ========== FALLOS DETECTADOS ==========
  if (order.fallos && order.fallos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(33, 33, 33);
    doc.text('FALLOS DETECTADOS', margin, yPos);
    yPos += 6;
    
    const fallosTable = order.fallos.map(f => [
      f.nombre,
      f.gravedad ? f.gravedad.charAt(0).toUpperCase() + f.gravedad.slice(1) : 'Media',
      f.observaciones || '-'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Fallo', 'Gravedad', 'Observaciones']],
      body: fallosTable,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [33, 33, 33], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });
    
    yPos = doc.lastAutoTable.finalY + 8;
  }

  // ========== CÁLCULO DE TOTALES ==========
  // Calcular totales con IVA
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
  
  // Posición para los totales
  const totalsX = pageWidth - margin - 55;
  let totalsY = yPos + 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`${subtotalConIVA.toFixed(2)} €`, pageWidth - margin, totalsY);
  
  if (descuentoAplicado > 0) {
    totalsY += 5;
    doc.text('Descuento:', totalsX, totalsY);
    doc.text(`- ${descuentoAplicado.toFixed(2)} €`, pageWidth - margin, totalsY);
  }
  
  totalsY += 8;
  drawLine(totalsY - 2);
  
  totalsY += 2;
  doc.text('Base imponible:', totalsX, totalsY);
  doc.text(`${baseImponible.toFixed(2)} €`, pageWidth - margin, totalsY);
  
  totalsY += 5;
  doc.text(`IVA (${IVA_PORCENTAJE}%):`, totalsX, totalsY);
  doc.text(`${iva.toFixed(2)} €`, pageWidth - margin, totalsY);
  
  totalsY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text('TOTAL:', totalsX, totalsY);
  doc.text(`${totalConIVA.toFixed(2)} €`, pageWidth - margin, totalsY);
  
  // Añadir recuadro para el total
  doc.setDrawColor(100, 100, 100);
  doc.rect(pageWidth - margin - 55, totalsY - 5, 55, 12);
  
  yPos = totalsY + 15;

  // ========== NOTAS ==========
  if (notas || order.budget_notes) {
    const notasTexto = notas || order.budget_notes;
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(33, 33, 33);
    doc.text('NOTAS:', margin, yPos);
    
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    const splitNotes = doc.splitTextToSize(notasTexto, pageWidth - margin * 2);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 4 + 5;
  }

  // ========== PIE DE PÁGINA ==========
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 20;
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Este presupuesto tiene una validez de 30 días. Los precios incluyen IVA.', margin, footerY);
  doc.text('Para cualquier consulta, contacte con nosotros.', margin, footerY + 4);
  doc.text(`LAM-RELOJEROS S.L · ${EMPRESA.telefono} · ${EMPRESA.email}`, margin, footerY + 8);
  
  // Número de página
  const pageNumber = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageNumber; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageNumber}`, pageWidth - margin - 20, pageHeight - 10);
  }
  
  // Guardar PDF
  doc.save(`presupuesto_${order.order_number || order.id.slice(-8)}.pdf`);
};