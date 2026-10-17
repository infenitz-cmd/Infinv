import React, { useState } from 'react';
import {
  Receipt,
  Printer,
  Search,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  Eye,
  X,
  CreditCard
} from 'lucide-react';

export interface BillItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  timestamp: string;
  customerName?: string;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  printStatus: 'Printed' | 'Pending';
  printerName: string;
}

const INITIAL_BILLS: Bill[] = [
  {
    id: 'b-1001',
    billNumber: 'INV-2026-1001',
    timestamp: '2026-10-17 21:45',
    customerName: 'Counter Walk-in',
    paymentMethod: 'UPI',
    items: [
      { id: '1', name: 'Vanilla Cream Roll', qty: 2, price: 65, total: 130 },
      { id: '2', name: 'Cold Brew Coffee', qty: 1, price: 120, total: 120 },
      { id: '3', name: 'Chocolate Muffin', qty: 1, price: 80, total: 80 }
    ],
    subtotal: 330,
    tax: 16.5,
    total: 346.5,
    printStatus: 'Printed',
    printerName: 'STOUT By SK-POS (USB)'
  },
  {
    id: 'b-1002',
    billNumber: 'INV-2026-1002',
    timestamp: '2026-10-17 21:58',
    customerName: 'Takeaway - Rahul',
    paymentMethod: 'Cash',
    items: [
      { id: '1', name: 'Strawberry Roll Cake', qty: 1, price: 90, total: 90 },
      { id: '2', name: 'Espresso Single', qty: 2, price: 70, total: 140 }
    ],
    subtotal: 230,
    tax: 11.5,
    total: 241.5,
    printStatus: 'Printed',
    printerName: 'STOUT By SK-POS (USB)'
  },
  {
    id: 'b-1003',
    billNumber: 'INV-2026-1003',
    timestamp: '2026-10-17 22:10',
    customerName: 'Table 4',
    paymentMethod: 'Card',
    items: [
      { id: '1', name: 'Cheesecake Slice', qty: 2, price: 140, total: 280 },
      { id: '2', name: 'Iced Caramel Latte', qty: 2, price: 110, total: 220 }
    ],
    subtotal: 500,
    tax: 25.0,
    total: 525.0,
    printStatus: 'Printed',
    printerName: 'STOUT By SK-POS (USB)'
  }
];

export const BillsView: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem('infenitz_pos_bills');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BILLS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Printed' | 'Pending'>('All');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New bill state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('UPI');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('100');
  const [tempItems, setTempItems] = useState<BillItem[]>([]);

  const handleAddItemToBill = () => {
    if (!newItemName.trim()) return;
    const qty = Math.max(1, parseInt(newItemQty) || 1);
    const price = Math.max(0, parseFloat(newItemPrice) || 0);
    const item: BillItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      qty,
      price,
      total: qty * price
    };
    setTempItems([...tempItems, item]);
    setNewItemName('');
    setNewItemQty('1');
    setNewItemPrice('100');
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempItems.length === 0) {
      alert('Please add at least one item to the bill.');
      return;
    }

    const subtotal = tempItems.reduce((acc, it) => acc + it.total, 0);
    const tax = +(subtotal * 0.05).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);
    const now = new Date();
    const dateStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBill: Bill = {
      id: `b-${Date.now()}`,
      billNumber: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: dateStr,
      customerName: newCustomerName.trim() || 'Counter Walk-in',
      paymentMethod: newPaymentMethod,
      items: tempItems,
      subtotal,
      tax,
      total,
      printStatus: 'Printed',
      printerName: 'STOUT By SK-POS (USB)'
    };

    const updated = [newBill, ...bills];
    setBills(updated);
    try {
      localStorage.setItem('infenitz_pos_bills', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setIsNewBillModalOpen(false);
    setTempItems([]);
    setNewCustomerName('');
    setToastMessage(`Bill #${newBill.billNumber} created and sent to STOUT thermal printer!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customerName && b.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' ? true : b.printStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
  const totalBillsCount = bills.length;
  const printedCount = bills.filter((b) => b.printStatus === 'Printed').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bills & POS Invoices</h2>
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>STOUT SK-POS (USB) Ready</span>
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Track customer receipts, sales records, and thermal printer dispatches.
          </p>
        </div>

        <button
          onClick={() => {
            setTempItems([]);
            setIsNewBillModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Bill</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bills</span>
            <div className="text-2xl font-black text-slate-900">{totalBillsCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sales</span>
            <div className="text-2xl font-black text-slate-900">₹{totalSales.toFixed(2)}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Printed via Thermal</span>
            <div className="text-2xl font-black text-slate-900">{printedCount}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bill # or customer..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              {(['All', 'Printed', 'Pending'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead className="bg-slate-100/70 uppercase text-[10px] font-extrabold text-slate-500 tracking-wider">
              <tr>
                <th className="p-3.5">Bill #</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Customer / Source</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Total (₹)</th>
                <th className="p-3.5">Printer Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length > 0 ? (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 font-mono">{b.billNumber}</td>
                    <td className="p-3.5 text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.timestamp}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{b.customerName || 'Walk-in'}</td>
                    <td className="p-3.5 text-slate-500">
                      {b.items.map((it) => `${it.qty}x ${it.name}`).join(', ')}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <CreditCard className="w-3 h-3 text-slate-500" />
                        <span>{b.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-slate-900 text-sm">₹{b.total.toFixed(2)}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{b.printStatus}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBill(b)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1"
                          title="View Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => {
                            setToastMessage(`Sent #${b.billNumber} to STOUT thermal printer!`);
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Reprint Bill to Thermal Printer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    No bills found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RECEIPT MODAL (Thermal Receipt Preview) --- */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 relative font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300">
              <span className="font-sans font-extrabold text-sm text-slate-900">Thermal Receipt Preview</span>
              <button
                onClick={() => setSelectedBill(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Print Receipt Simulation (80mm) */}
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3 text-slate-800">
              <div className="text-center space-y-1">
                <h3 className="font-sans font-black text-lg text-slate-900">INFENITZ BAKERY</h3>
                <p className="text-[10px] text-slate-500 font-sans">123 Market Street, City</p>
                <p className="text-[10px] text-slate-500 font-sans">GSTIN: 29AAAAA0000A1Z5</p>
                <p className="text-[10px] text-slate-500 font-sans">Printer: {selectedBill.printerName}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill: {selectedBill.billNumber}</span>
                  <span>{selectedBill.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{selectedBill.timestamp}</span>
                  <span>{selectedBill.customerName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                      <th className="text-left pb-1 font-bold">ITEM</th>
                      <th className="text-center pb-1 font-bold">QTY</th>
                      <th className="text-right pb-1 font-bold">AMT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBill.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-1">{it.name}</td>
                        <td className="py-1 text-center">{it.qty}</td>
                        <td className="py-1 text-right">₹{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%):</span>
                  <span>₹{selectedBill.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1">
                  <span>GRAND TOTAL:</span>
                  <span>₹{selectedBill.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-500 font-sans">
                *** THANK YOU FOR VISITING! ***
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setToastMessage(`Thermal print job sent to STOUT SK-POS!`);
                  setSelectedBill(null);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print to Thermal Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE NEW BILL MODAL --- */}
      {isNewBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900">Create New Bill</h3>
              <button
                onClick={() => setIsNewBillModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Customer / Table
                  </label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Table 2 or Counter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Method
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              {/* Add Items section */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="block text-[11px] font-bold text-slate-700">Add Line Items</span>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      min="0"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToBill}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Items list preview */}
                {tempItems.length > 0 && (
                  <div className="border-t border-slate-200/80 pt-2 space-y-1">
                    {tempItems.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                        <span>{it.qty}x {it.name}</span>
                        <span className="font-bold">₹{it.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Save & Print
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
