const { useState } = React;
const { Plus, Trash2, FileSpreadsheet, Printer } = lucide;

const PRICE_DATA = {
  'Sample Prep-Simple': { unit: 'per sample', internal: 65, nonprofit: 94, forprofit: 96 },
  'Sample Prep-Complex': { unit: 'per sample', internal: 96, nonprofit: 134, forprofit: 135 },
  'Sample Prep-Trypsin': { unit: 'per sample', internal: 56, nonprofit: 82, forprofit: 85 },
  'Sample Prep-Custom enzyme': { unit: 'per sample', internal: 80, nonprofit: 126, forprofit: 130 },
  'Sample Prep-TiO2': { unit: 'per sample', internal: 130, nonprofit: 170, forprofit: 200 },
  'Sample Prep-Desalt': { unit: 'per sample', internal: 56, nonprofit: 82, forprofit: 85 },
  'Sample Prep-NanoDrop': { unit: 'per sample', internal: 9, nonprofit: 16, forprofit: 16 },
  'Sample Prep-Offline LC': { unit: 'per sample', internal: 395, nonprofit: 530, forprofit: 550 },
  'Sample Prep-Isotopic Labeling': { unit: 'per set', internal: 2000, nonprofit: 3000, forprofit: 3100 },
  'HRMS-Exact Mass': { unit: 'per sample', internal: 210, nonprofit: 330, forprofit: 335 },
  'HRMS-Intact Protein Mass': { unit: 'per sample', internal: 390, nonprofit: 594, forprofit: 594 },
  'LCMSMS-Short gradient': { unit: 'per injection', internal: 104, nonprofit: 150, forprofit: 158 },
  'LCMSMS-Medium gradient': { unit: 'per injection', internal: 118, nonprofit: 171, forprofit: 175 },
  'LCMSMS-Long gradient': { unit: 'per injection', internal: 134, nonprofit: 200, forprofit: 200 },
  'Targeted-SM-Sample': { unit: 'per sample', internal: 75, nonprofit: 110, forprofit: 157 },
  'Targeted-SM-StdCurve': { unit: 'each', internal: 360, nonprofit: 560, forprofit: 557 },
  'Targeted-SM-Optimization': { unit: 'per set', internal: 1040, nonprofit: 1505, forprofit: 1580 },
  'Targeted-SM-Data analysis': { unit: 'per set', internal: 275, nonprofit: 388, forprofit: 388 },
  'DataAnalysis-Protein Quantitation': { unit: 'per set', internal: 965, nonprofit: 1391, forprofit: 1395 },
  'DataAnalysis-Protein ID': { unit: 'per sample', internal: 52, nonprofit: 75, forprofit: 75 },
  'DataAnalysis-Database Configuration': { unit: 'per database', internal: 95, nonprofit: 263, forprofit: 262 },
  'Consulting': { unit: 'per hour', internal: 318, nonprofit: 465, forprofit: 465 },
  'Open Access-Usage': { unit: 'per day', internal: 630, nonprofit: 910, forprofit: 950 }
};

function QuoteGenerator() {
  const [clientName, setClientName] = useState('');
  const [priceType, setPriceType] = useState('internal');
  const [splitType, setSplitType] = useState('full');
  const [nidaPercent, setNidaPercent] = useState(50);
  const [items, setItems] = useState([]);
  const [showQuote, setShowQuote] = useState(false);

  const addItem = () => {
    setItems([...items, { service: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateSubtotal = (item) => {
    if (!item.service) return 0;
    const priceKey = priceType === 'internal' ? 'internal' : 
                     priceType === 'nonprofit' ? 'nonprofit' : 'forprofit';
    const unitPrice = PRICE_DATA[item.service][priceKey];
    return unitPrice * (item.quantity || 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const calculateNidaTotal = () => {
    return calculateTotal() * (nidaPercent / 100);
  };

  const calculateCoaTotal = () => {
    return calculateTotal() * ((100 - nidaPercent) / 100);
  };

  const generateQuote = () => {
    if (!clientName.trim()) {
      alert('Please enter client name');
      return;
    }
    if (items.length === 0 || items.some(item => !item.service)) {
      alert('Please add at least one service');
      return;
    }
    setShowQuote(true);
  };

  const exportToExcel = () => {
    const priceKey = priceType === 'internal' ? 'internal' : 
                     priceType === 'nonprofit' ? 'nonprofit' : 'forprofit';
    
    const wsData = [
      [clientName],
      [],
    ];

    const headers = ['Service', 'Unit Cost', 'Quantity', 'Subtotal'];
    if (splitType === 'split') {
      headers.push(`${nidaPercent}% NIDA`, `${coaPercent}% COA`);
    }
    wsData.push(headers);

    items.forEach(item => {
      const unitPrice = PRICE_DATA[item.service][priceKey];
      const subtotal = calculateSubtotal(item);
      const row = [item.service, unitPrice, item.quantity, subtotal];
      if (splitType === 'split') {
        row.push(subtotal * (nidaPercent / 100), subtotal * (coaPercent / 100));
      }
      wsData.push(row);
    });

    const totalRow = ['', '', 'TOTAL', calculateTotal()];
    if (splitType === 'split') {
      totalRow.push(calculateNidaTotal(), calculateCoaTotal());
    }
    wsData.push(totalRow);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
    if (splitType === 'split') {
      ws['!cols'].push({ wch: 12 }, { wch: 12 });
    }

    const numCols = splitType === 'split' ? 6 : 4;
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];

    XLSX.utils.book_append_sheet(wb, ws, 'Quote');

    const date = new Date().toISOString().split('T')[0];
    const filename = `Quote_${clientName.replace(/\s+/g, '_')}_${date}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const printQuote = () => {
    const element = document.getElementById('quote-display');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Quote - ${clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            h2 { text-align: center; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const coaPercent = 100 - nidaPercent;

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8' },
    React.createElement('div', { className: 'max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-8' },
      React.createElement('h1', { className: 'text-3xl font-bold text-center mb-8 text-indigo-900' },
        'Service Quote Generator'
      ),

      !showQuote ? 
        React.createElement('div', { className: 'space-y-6' },
          React.createElement('div', { className: 'grid md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-semibold mb-2 text-gray-700' }, 'Client Name *'),
              React.createElement('input', {
                type: 'text',
                value: clientName,
                onChange: (e) => setClientName(e.target.value),
                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                placeholder: 'Enter client name'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-semibold mb-2 text-gray-700' }, 'Price Type *'),
              React.createElement('select', {
                value: priceType,
                onChange: (e) => setPriceType(e.target.value),
                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              },
                React.createElement('option', { value: 'internal' }, 'Internal'),
                React.createElement('option', { value: 'nonprofit' }, 'Non-Profit'),
                React.createElement('option', { value: 'forprofit' }, 'For-Profit')
              )
            )
          ),

          React.createElement('div', { className: 'grid md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-semibold mb-2 text-gray-700' }, 'Billing Type *'),
              React.createElement('select', {
                value: splitType,
                onChange: (e) => setSplitType(e.target.value),
                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              },
                React.createElement('option', { value: 'full' }, 'Full Price'),
                React.createElement('option', { value: 'split' }, 'Split (NIDA/COA)')
              )
            ),
            splitType === 'split' && React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-semibold mb-2 text-gray-700' }, 'NIDA Percentage (%)'),
              React.createElement('input', {
                type: 'number',
                min: '0',
                max: '100',
                value: nidaPercent,
                onChange: (e) => setNidaPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0))),
                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              })
            )
          ),

          React.createElement('div', null,
            React.createElement('div', { className: 'flex justify-between items-center mb-4' },
              React.createElement('h2', { className: 'text-xl font-bold text-gray-800' }, 'Line Items'),
              React.createElement('button', {
                onClick: addItem,
                className: 'flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
              },
                React.createElement(Plus, { size: 20 }),
                ' Add Item'
              )
            ),

            React.createElement('div', { className: 'space-y-3' },
              items.map((item, index) =>
                React.createElement('div', { key: index, className: 'flex gap-3 items-start bg-gray-50 p-4 rounded-lg' },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('select', {
                      value: item.service,
                      onChange: (e) => updateItem(index, 'service', e.target.value),
                      className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500'
                    },
                      React.createElement('option', { value: '' }, 'Select Service'),
                      Object.keys(PRICE_DATA).map(service =>
                        React.createElement('option', { key: service, value: service }, service)
                      )
                    )
                  ),
                  React.createElement('div', { className: 'w-32' },
                    React.createElement('input', {
                      type: 'number',
                      min: '1',
                      value: item.quantity,
                      onChange: (e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1),
                      className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500',
                      placeholder: 'Qty'
                    })
                  ),
                  React.createElement('button', {
                    onClick: () => removeItem(index),
                    className: 'p-2 text-red-600 hover:bg-red-50 rounded-lg transition'
                  },
                    React.createElement(Trash2, { size: 20 })
                  )
                )
              )
            )
          ),

          React.createElement('button', {
            onClick: generateQuote,
            className: 'w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg'
          }, 'Generate Quote')
        )
      :
        React.createElement('div', null,
          React.createElement('div', { id: 'quote-display' },
            React.createElement('h2', { className: 'text-2xl font-bold text-center mb-6 text-gray-800' }, clientName),

            React.createElement('div', { className: 'overflow-x-auto' },
              React.createElement('table', { className: 'w-full border-collapse border border-gray-300' },
                React.createElement('thead', null,
                  React.createElement('tr', { className: 'bg-indigo-600 text-white' },
                    React.createElement('th', { className: 'border border-gray-300 px-4 py-3 text-left' }, 'Service'),
                    React.createElement('th', { className: 'border border-gray-300 px-4 py-3 text-center' }, 'Unit Cost'),
                    React.createElement('th', { className: 'border border-gray-300 px-4 py-3 text-center' }, 'Quantity'),
                    React.createElement('th', { className: 'border border-gray-300 px-4 py-3 text-right' }, 'Subtotal'),
                    splitType === 'split' && [
                      React.createElement('th', { key: 'nida', className: 'border border-gray-300 px-4 py-3 text-right' }, `${nidaPercent}% NIDA`),
                      React.createElement('th', { key: 'coa', className: 'border border-gray-300 px-4 py-3 text-right' }, `${coaPercent}% COA`)
                    ]
                  )
                ),
                React.createElement('tbody', null,
                  items.map((item, index) => {
                    const subtotal = calculateSubtotal(item);
                    const priceKey = priceType === 'internal' ? 'internal' : 
                                   priceType === 'nonprofit' ? 'nonprofit' : 'forprofit';
                    const unitPrice = PRICE_DATA[item.service][priceKey];
                    
                    return React.createElement('tr', { key: index, className: 'hover:bg-gray-50' },
                      React.createElement('td', { className: 'border border-gray-300 px-4 py-2' }, item.service),
                      React.createElement('td', { className: 'border border-gray-300 px-4 py-2 text-center' }, `$${unitPrice.toFixed(2)}`),
                      React.createElement('td', { className: 'border border-gray-300 px-4 py-2 text-center' }, item.quantity),
                      React.createElement('td', { className: 'border border-gray-300 px-4 py-2 text-right' }, `$${subtotal.toFixed(2)}`),
                      splitType === 'split' && [
                        React.createElement('td', { key: 'nida', className: 'border border-gray-300 px-4 py-2 text-right' }, 
                          `$${(subtotal * (nidaPercent / 100)).toFixed(2)}`
                        ),
                        React.createElement('td', { key: 'coa', className: 'border border-gray-300 px-4 py-2 text-right' }, 
                          `$${(subtotal * (coaPercent / 100)).toFixed(2)}`
                        )
                      ]
                    );
                  }),
                  React.createElement('tr', { className: 'bg-gray-100 font-bold' },
                    React.createElement('td', { colSpan: '3', className: 'border border-gray-300 px-4 py-3 text-right' }, 'TOTAL'),
                    React.createElement('td', { className: 'border border-gray-300 px-4 py-3 text-right' }, `$${calculateTotal().toFixed(2)}`),
                    splitType === 'split' && [
                      React.createElement('td', { key: 'nida', className: 'border border-gray-300 px-4 py-3 text-right' }, 
                        `$${calculateNidaTotal().toFixed(2)}`
                      ),
                      React.createElement('td', { key: 'coa', className: 'border border-gray-300 px-4 py-3 text-right' }, 
                        `$${calculateCoaTotal().toFixed(2)}`
                      )
                    ]
                  )
                )
              )
            )
          ),

          React.createElement('div', { className: 'flex gap-4 mt-6' },
            React.createElement('button', {
              onClick: () => setShowQuote(false),
              className: 'flex-1 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition'
            }, 'Edit Quote'),
            React.createElement('button', {
              onClick: exportToExcel,
              className: 'flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2'
            },
              React.createElement(FileSpreadsheet, { size: 20 }),
              ' Export to Excel'
            ),
            React.createElement('button', {
              onClick: printQuote,
              className: 'flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2'
            },
              React.createElement(Printer, { size: 20 }),
              ' Print'
            )
          )
        )
    )
  );
}

ReactDOM.render(React.createElement(QuoteGenerator), document.getElementById('root'));
