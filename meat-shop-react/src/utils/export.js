  import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

// Экспорт в Excel
export const exportToExcel = (orders) => {
  const data = orders.map((order, index) => ({
    '№': index + 1,
    'ID заказа': order.id,
    'Дата': formatDate(order.createdAt),
    'Статус': order.status,
    'Клиент': order.customer.name,
    'Телефон': order.customer.phone,
    'Тип доставки': order.customer.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка',
    'Адрес': order.customer.address || '-',
    'Комментарий': order.customer.comment || '-',
    'Сумма': order.total + ' ₽',
    'Количество товаров': order.items.reduce((sum, item) => sum + item.quantity, 0)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Заказы');
  XLSX.writeFile(wb, `orders_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Экспорт в Word
export const exportToWord = (orders) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'Отчет по заказам',
          heading: 'Heading1',
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: `Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`,
          spacing: { after: 300 }
        }),
        new Paragraph({
          text: `Всего заказов: ${orders.length}`,
          spacing: { after: 500 }
        }),
        ...orders.map((order, index) => [
          new Paragraph({
            text: `Заказ №${order.id}`,
            heading: 'Heading2',
            spacing: { before: 300, after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Дата: ', bold: true }),
              new TextRun(formatDate(order.createdAt))
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Статус: ', bold: true }),
              new TextRun(order.status)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Клиент: ', bold: true }),
              new TextRun(order.customer.name)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Телефон: ', bold: true }),
              new TextRun(order.customer.phone)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Тип доставки: ', bold: true }),
              new TextRun(order.customer.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка')
            ]
          }),
          order.customer.address && new Paragraph({
            children: [
              new TextRun({ text: 'Адрес: ', bold: true }),
              new TextRun(order.customer.address)
            ]
          }),
          order.customer.comment && new Paragraph({
            children: [
              new TextRun({ text: 'Комментарий: ', bold: true }),
              new TextRun(order.customer.comment)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Сумма: ', bold: true }),
              new TextRun({ text: `${order.total} ₽`, bold: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Товары: ', bold: true })
            ]
          }),
          ...order.items.map(item => new Paragraph({
            children: [
              new TextRun({ text: `  • ${item.name} x${item.quantity} - ${item.price * item.quantity} ₽` })
            ]
          })),
          new Paragraph({
            text: '----------------------------------------',
            spacing: { after: 300 }
          })
        ])
      ]
    }]
  });

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  });
};

// Экспорт в PDF
export const exportToPDF = (orders) => {
  const doc = new jsPDF();
  
  // Заголовок
  doc.setFontSize(20);
  doc.text('Отчет по заказам', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`, 14, 30);
  doc.text(`Всего заказов: ${orders.length}`, 14, 36);
  
  // Данные для таблицы
  const tableData = orders.map((order, index) => [
    index + 1,
    order.id,
    formatDate(order.createdAt),
    order.status,
    order.customer.name,
    order.customer.phone,
    order.customer.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка',
    order.customer.address || '-',
    order.total + ' ₽',
    order.items.reduce((sum, item) => sum + item.quantity, 0)
  ]);
  
  // Таблица
  autoTable(doc, {
    startY: 45,
    head: [['№', 'ID', 'Дата', 'Статус', 'Клиент', 'Телефон', 'Тип', 'Адрес', 'Сумма', 'Товары']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
      7: { cellWidth: 40 },
      8: { cellWidth: 25 },
      9: { cellWidth: 25 }
    }
  });
  
  // Детализация каждого заказа
  let finalY = doc.lastAutoTable.finalY + 10;
  
  orders.forEach((order, index) => {
    if (finalY > 270) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(12);
    doc.text(`Заказ №${order.id}`, 14, finalY);
    finalY += 7;
    
    doc.setFontSize(9);
    doc.text(`Дата: ${formatDate(order.createdAt)}`, 14, finalY);
    finalY += 6;
    doc.text(`Клиент: ${order.customer.name}`, 14, finalY);
    finalY += 6;
    doc.text(`Телефон: ${order.customer.phone}`, 14, finalY);
    finalY += 6;
    doc.text(`Тип доставки: ${order.customer.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}`, 14, finalY);
    finalY += 6;
    
    if (order.customer.address) {
      doc.text(`Адрес: ${order.customer.address}`, 14, finalY);
      finalY += 6;
    }
    
    if (order.customer.comment) {
      doc.text(`Комментарий: ${order.customer.comment}`, 14, finalY);
      finalY += 6;
    }
    
    doc.text(`Сумма: ${order.total} ₽`, 14, finalY);
    finalY += 8;
    
    // Товары
    doc.setFontSize(9);
    doc.text('Товары:', 14, finalY);
    finalY += 5;
    
    order.items.forEach(item => {
      if (finalY > 270) {
        doc.addPage();
        finalY = 20;
      }
      doc.text(`  • ${item.name} x${item.quantity} - ${item.price * item.quantity} ₽`, 14, finalY);
      finalY += 5;
    });
    
    finalY += 5;
    doc.text('----------------------------------------', 14, finalY);
    finalY += 10;
  });
  
  doc.save(`orders_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Импорт из Excel
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const importedOrders = jsonData.map((row, index) => {
          // Преобразуем данные из Excel в формат заказа
          return {
            id: Date.now() + index, // Генерируем новый ID
            customer: {
              name: row['Клиент'] || row['Customer'] || 'Неизвестный',
              phone: row['Телефон'] || row['Phone'] || '',
              deliveryType: row['Тип доставки'] === 'Доставка' ? 'delivery' : 'pickup',
              address: row['Адрес'] || row['Address'] || '',
              comment: row['Комментарий'] || row['Comment'] || ''
            },
            items: row['Товары'] ? parseItems(row['Товары']) : [],
            total: row['Сумма'] ? parseFloat(row['Сумма']) : 0,
            status: row['Статус'] || 'pending',
            createdAt: Date.now()
          };
        });
        
        resolve(importedOrders);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Импорт из Word
export const importFromWord = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const doc = new Document({
          sections: [{
            properties: {},
            children: []
          }]
        });
        
        // Для Word (.docx) используем библиотеку docx для чтения
        // Но так как у нас нет готовой функции для чтения, 
        // мы будем использовать альтернативный подход - парсим XML
        const xml = new TextDecoder('utf-8').decode(arrayBuffer);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'application/xml');
        
        // Извлекаем текст из документа
        const text = xmlDoc.textContent || '';
        const orders = parseWordText(text);
        
        const importedOrders = orders.map((order, index) => ({
          id: Date.now() + index,
          customer: {
            name: order.customerName || 'Неизвестный',
            phone: order.phone || '',
            deliveryType: order.deliveryType === 'Доставка' ? 'delivery' : 'pickup',
            address: order.address || '',
            comment: order.comment || ''
          },
          items: order.items || [],
          total: order.total || 0,
          status: order.status || 'pending',
          createdAt: Date.now()
        }));
        
        resolve(importedOrders);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Импорт из PDF
export const importFromPDF = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Для PDF используем jsPDF для чтения
        const pdf = new jsPDF();
        pdf.load(e.target.result);
        
        // Получаем текст из PDF
        const text = pdf.output('text');
        const orders = parsePDFText(text);
        
        const importedOrders = orders.map((order, index) => ({
          id: Date.now() + index,
          customer: {
            name: order.customerName || 'Неизвестный',
            phone: order.phone || '',
            deliveryType: order.deliveryType === 'Доставка' ? 'delivery' : 'pickup',
            address: order.address || '',
            comment: order.comment || ''
          },
          items: order.items || [],
          total: order.total || 0,
          status: order.status || 'pending',
          createdAt: Date.now()
        }));
        
        resolve(importedOrders);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Вспомогательные функции для парсинга
function parseItems(itemsString) {
  if (!itemsString) return [];
  
  const items = [];
  const lines = itemsString.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/(.+?)\s*x(\d+)\s*-\s*(\d+)\s*₽/);
    if (match) {
      items.push({
        name: match[1].trim(),
        price: parseFloat(match[3]),
        quantity: parseInt(match[2])
      });
    }
  });
  
  return items;
}

function parseWordText(text) {
  const orders = [];
  const orderBlocks = text.split(/Заказ №\d+/);
  
  orderBlocks.forEach(block => {
    if (block.trim()) {
      const order = {
        customerName: '',
        phone: '',
        deliveryType: 'pickup',
        address: '',
        comment: '',
        items: [],
        total: 0,
        status: 'pending'
      };
      
      // Парсим данные из блока
      const lines = block.split('\n');
      lines.forEach(line => {
        if (line.includes('Клиент:')) {
          order.customerName = line.replace('Клиент:', '').trim();
        } else if (line.includes('Телефон:')) {
          order.phone = line.replace('Телефон:', '').trim();
        } else if (line.includes('Тип доставки:')) {
          order.deliveryType = line.replace('Тип доставки:', '').trim() === 'Доставка' ? 'delivery' : 'pickup';
        } else if (line.includes('Адрес:')) {
          order.address = line.replace('Адрес:', '').trim();
        } else if (line.includes('Комментарий:')) {
          order.comment = line.replace('Комментарий:', '').trim();
        } else if (line.includes('Сумма:')) {
          order.total = parseFloat(line.replace('Сумма:', '').trim()) || 0;
        } else if (line.includes('Товары:')) {
          order.items = parseItems(line);
        } else if (line.includes('Статус:')) {
          order.status = line.replace('Статус:', '').trim();
        }
      });
      
      if (order.customerName) {
        orders.push(order);
      }
    }
  });
  
  return orders;
}

function parsePDFText(text) {
  const orders = [];
  const orderBlocks = text.split(/Заказ №\d+/);
  
  orderBlocks.forEach(block => {
    if (block.trim()) {
      const order = {
        customerName: '',
        phone: '',
        deliveryType: 'pickup',
        address: '',
        comment: '',
        items: [],
        total: 0,
        status: 'pending'
      };
      
      // Парсим данные из блока
      const lines = block.split('\n');
      lines.forEach(line => {
        if (line.includes('Клиент:')) {
          order.customerName = line.replace('Клиент:', '').trim();
        } else if (line.includes('Телефон:')) {
          order.phone = line.replace('Телефон:', '').trim();
        } else if (line.includes('Тип доставки:')) {
          order.deliveryType = line.replace('Тип доставки:', '').trim() === 'Доставка' ? 'delivery' : 'pickup';
        } else if (line.includes('Адрес:')) {
          order.address = line.replace('Адрес:', '').trim();
        } else if (line.includes('Комментарий:')) {
          order.comment = line.replace('Комментарий:', '').trim();
        } else if (line.includes('Сумма:')) {
          order.total = parseFloat(line.replace('Сумма:', '').trim()) || 0;
        } else if (line.includes('Товары:')) {
          order.items = parseItems(line);
        } else if (line.includes('Статус:')) {
          order.status = line.replace('Статус:', '').trim();
        }
      });
      
      if (order.customerName) {
        orders.push(order);
      }
    }
  });
  
  return orders;
}
