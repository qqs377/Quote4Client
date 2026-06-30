const { useState } = React;

const PRICE_DATA = {
  'Sample Prep-Simple': { unit: 'per sample', internal: 70, nonprofit: 104, forprofit: 112 },
  'Sample Prep-Complex': { unit: 'per sample', internal: 98, nonprofit: 139, forprofit: 149 },
  'Sample Prep-Trypsin': { unit: 'per sample', internal: 61, nonprofit: 90, forprofit: 94 },
  'Sample Prep-Custom enzyme': { unit: 'per sample', internal: 84, nonprofit: 138, forprofit: 143 },
  'Sample Prep-TiO2': { unit: 'per sample', internal: 140, nonprofit: 187, forprofit: 255 },
  'Sample Prep-Desalt': { unit: 'per sample', internal: 60, nonprofit: 90, forprofit: 94 },
  'Sample Prep-NanoDrop': { unit: 'per sample', internal: 10, nonprofit: 17, forprofit: 18 },
  'Sample Prep-Offline LC': { unit: 'per sample', internal: 415, nonprofit: 583, forprofit: 1409 },
  'Sample Prep-Isotopic Labeling': { unit: 'per set', internal: 2940, nonprofit: 3300, forprofit: 3500 },
  'HRMS-Exact Mass': { unit: 'per sample', internal: 221, nonprofit: 363, forprofit: 369 },
  'HRMS-Intact Protein Mass': { unit: 'per sample', internal: 198, nonprofit: 324, forprofit: 330 },
  'LCMSMS-Short gradient': { unit: 'per injection', internal: 108, nonprofit: 172, forprofit: 174 },
  'LCMSMS-Medium gradient': { unit: 'per injection', internal: 124, nonprofit: 190, forprofit: 193 },
  'LCMSMS-Long gradient': { unit: 'per injection', internal: 141, nonprofit: 220, forprofit: 240 },
  'Targeted-SM-Sample': { unit: 'per sample', internal: 79, nonprofit: 121, forprofit: 160 },
  'Targeted-SM-StdCurve': { unit: 'each', internal: 378, nonprofit: 616, forprofit: 620 },
  'Targeted-SM-Optimization': { unit: 'per set', internal: 1092, nonprofit: 1656, forprofit: 1738 },
  'Targeted-SM-Data analysis': { unit: 'per set', internal: 280, nonprofit: 390, forprofit: 410 },
  'DataAnalysis-Protein Quantitation': { unit: 'per set', internal: 1016, nonprofit: 1531, forprofit: 1688 },
  'DataAnalysis-Protein ID': { unit: 'per sample', internal: 55, nonprofit: 82, forprofit: 83 },
  'DataAnalysis-Database Configuration': { unit: 'per database', internal: 100, nonprofit: 290, forprofit: 290 },
  'Consulting': { unit: 'per hour', internal: 334, nonprofit: 512, forprofit: 512 },
  'Open Access-Usage': { unit: 'per day', internal: 662, nonprofit: 1010, forprofit: 1045 },
  'LCMSMS-OAZ DataCollection': { unit: 'per injection', internal: 94, nonprofit: 140, forprofit: 153 },
  'Sample Prep-EquipmentUse': { unit: 'per hour', internal: 100, nonprofit: 140, forprofit: 150 }
};

function QuoteGenerator() {
  const [clientName, setClientName] = useState('');
  const [priceType, setPriceType] = useState('internal');
  const [splitType, setSplitType] = useState('full');
  const [nidaPercent, setNidaPercent] = useState(90);
  const [items, setItems] = useState([
    { service: 'Sample Prep-Simple', quantity: 2 },
    { service: 'Sample Prep-Trypsin', quantity: 2 },
    { service: 'Sample Prep-Desalt', quantity: 2 },
    { service: 'Sample Prep-NanoDrop', quantity: 2 },
    { service: 'LCMSMS-Long gradient', quantity: 2 },
    { service: 'DataAnalysis-Protein ID', quantity: 2 },
    { service: 'Consulting', quantity: 0.25 }
  ]);
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

    const coaPercent = 100 - nidaPercent;
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
              }, '➕ Add Item')
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
                      min: '0.1',
                      step: '0.1',
                      value: item.quantity,
                      onChange: (e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1),
                      className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500',
                      placeholder: 'Qty'
                    })
                  ),
                  React.createElement('button', {
                    onClick: () => removeItem(index),
                    className: 'p-2 text-red-600 hover:bg-red-50 rounded-lg transition'
                  }, '🗑️')
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
            }, '📊 Export to Excel'),
            React.createElement('button', {
              onClick: printQuote,
              className: 'flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2'
            }, '🖨️ Print')
          )
        )
    )
  );
}

ReactDOM.render(React.createElement(QuoteGenerator), document.getElementById('root'));
