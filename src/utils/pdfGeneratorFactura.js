import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Datos de la empresa
const EMPRESA = {
  nombre: 'LAM-RELOJEROS S.L',
  cif: 'B-88615489',
  telefono: '672373275',
  email: 'info@lam-relojeros.com',
  direccion: 'C/ Ejemplo, 123',
  ciudad: '28001 Madrid',
  cuentaBancaria: 'ES00 0000 0000 0000 0000 0000'
};

export const generateFacturaPDF = async (factura, order, client) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // ========== HEADER CON LOGO ==========
  // Línea decorativa superior
  doc.setDrawColor(200, 100, 110);
  doc.setLineWidth(0.5);
  doc.line(margin, y - 2, pageWidth - margin, y - 2);
  
  // Cargar logo desde la carpeta public
  try {
    const logoImg = new Image();
    logoImg.src = '/logotaller.jpg'; // Ruta relativa desde public
    
    // Esperar a que cargue la imagen
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = () => {
        console.warn('Logo no encontrado, usando texto alternativo');
        resolve();
      };
    });
    
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      // Añadir logo (ajustar tamaño según necesidad)
      doc.addImage(logoImg, 'PNG', margin, y, 30, 30);
      y += 32;
    } else {
      // Texto alternativo como logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(200, 170, 110);
      doc.text('LAM', margin, y + 12);
      y += 20;
    }
  } catch (error) {
    console.warn('Error cargando logo:', error);
    // Texto alternativo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(200, 170, 110);
    doc.text('LAM', margin, y + 12);
    y += 20;
  }
  
  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(60, 50, 40);
  doc.text('FACTURA', margin + 35, y + 8);
  
  // Número y fechas (alineados a la derecha)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 90, 80);
  const rightX = pageWidth - margin;
  doc.text(`Nº ${factura.numero}`, rightX - 50, y + 4);
  doc.text(`Fecha: ${new Date(factura.fecha).toLocaleDateString('es-ES')}`, rightX - 50, y + 10);
  doc.text(`Vencimiento: ${new Date(factura.fecha).toLocaleDateString('es-ES')}`, rightX - 50, y + 16);
  
  y += 28;
  
  // Separador decorativo
  doc.setDrawColor(220, 210, 190);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // ========== DATOS ==========
  // Columna izquierda: Empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(140, 120, 90);
  doc.text('EMPRESA', margin, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 65, 60);
  doc.text(EMPRESA.nombre, margin, y + 6);
  doc.text(EMPRESA.direccion, margin, y + 12);
  doc.text(EMPRESA.ciudad, margin, y + 18);
  doc.text(`CIF: ${EMPRESA.cif}`, margin, y + 24);
  doc.text(`Tel: ${EMPRESA.telefono}`, margin, y + 30);
  
  // Columna derecha: Cliente
  const col2X = pageWidth / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(140, 120, 90);
  doc.text('CLIENTE', col2X, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 65, 60);
  doc.text(client.name, col2X, y + 6);
  if (client.nif) doc.text(`NIF: ${client.nif}`, col2X, y + 12);
  doc.text(`Tel: ${client.phone}`, col2X, y + 18);
  if (client.email) doc.text(client.email, col2X, y + 24);
  if (client.address) doc.text(client.address, col2X, y + 30);
  
  y += 42;
  doc.setDrawColor(220, 210, 190);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ========== CONCEPTO ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(90, 80, 70);
  doc.text('CONCEPTO', margin, y);
  
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 95, 90);
  doc.text(factura.concepto, margin, y);
  
  y += 12;
  doc.setDrawColor(230, 225, 215);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ========== TABLA DE TRABAJOS ==========
  if (order?.trabajos?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(90, 80, 70);
    doc.text('DETALLE DE TRABAJOS', margin, y);
    y += 6;
    
    const tableData = order.trabajos.map(t => [
      t.nombre,
      (t.cantidad || 1).toString(),
      `${(t.tarifa_aplicada || t.tarifa_base || 0).toFixed(2)} €`,
      t.descuento ? `${t.descuento}%` : '—',
      `${(t.total || 0).toFixed(2)} €`
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Trabajo', 'Cant.', 'Precio', 'Dto.', 'Importe']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { 
        fontSize: 9, 
        cellPadding: 4, 
        textColor: [70, 65, 60],
        lineColor: [230, 225, 215],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [245, 240, 235], 
        textColor: [80, 70, 60], 
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 40, halign: 'right' }
      }
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // ========== TOTALES ==========
  const totalBoxWidth = 75;
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  
  // Fondo con borde sutil
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(210, 195, 175);
  doc.roundedRect(totalBoxX - 5, y - 4, totalBoxWidth + 10, 52, 3, 3, 'FD');
  
  let ty = y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 90, 80);
  
  doc.text('Base imponible', totalBoxX, ty);
  doc.text(`${(factura.base_imponible || 0).toFixed(2)} €`, pageWidth - margin, ty, { align: 'right' });
  
  ty += 7;
  doc.text('IVA (21%)', totalBoxX, ty);
  doc.text(`${(factura.iva || 0).toFixed(2)} €`, pageWidth - margin, ty, { align: 'right' });
  
  ty += 12;
  doc.setDrawColor(200, 185, 165);
  doc.line(totalBoxX - 2, ty - 3, pageWidth - margin + 2, ty - 3);
  
  ty += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(70, 60, 50);
  doc.text('TOTAL', totalBoxX, ty);
  doc.setFontSize(18);
  doc.setTextColor(60, 50, 40);
  doc.text(`${(factura.total || 0).toFixed(2)} €`, pageWidth - margin, ty, { align: 'right' });
  
  y = ty + 22;

  // ========== NOTAS ==========
  if (order?.budget_notes) {
    doc.setFillColor(250, 248, 245);
    doc.roundedRect(margin, y - 3, pageWidth - margin * 2, 12 + (order.budget_notes.length / 50) * 8, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 100, 80);
    doc.text('NOTAS', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 90, 85);
    const notes = doc.splitTextToSize(order.budget_notes, pageWidth - margin * 2 - 10);
    doc.text(notes, margin, y);
    y += notes.length * 4 + 10;
  }

  // ========== PIE ==========
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 20;
  
  // Línea decorativa sobre el pie
  doc.setDrawColor(210, 195, 175);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  
  doc.setFontSize(7);
  doc.setTextColor(130, 115, 100);
  doc.text(`Forma de pago: Transferencia bancaria · IBAN: ${EMPRESA.cuentaBancaria}`, margin, footerY);
  doc.text(`${EMPRESA.nombre} · ${EMPRESA.telefono} · ${EMPRESA.email}`, margin, footerY + 5);
  
  // Guardar
  doc.save(`factura_${factura.numero}.pdf`);
};