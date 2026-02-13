'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'Shipping' | 'Marketing' | 'Software' | 'Inventory' | 'Legal-Admin' | 'Other';
  date: string;
  gst_applied: boolean;
  created_at: string;
}

type FinanceView = 'daily' | 'monthly' | 'expenses' | 'tax';

interface DailyP_L {
  date: string;
  revenue: number;
  expenses: number;
  net: number;
  impact: number;
  margin: number;
}

export default function ExpensesPage() {
  const [financeView, setFinanceView] = useState<FinanceView>('daily');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'Other' as Expense['category'],
    date: new Date().toISOString().split('T')[0],
    gst_applied: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = ordersSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Order
        );
        setOrders(ordersData);

        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
        const expensesData = expensesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Expense
        );
        setExpenses(expensesData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredOrders = () => {
    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return dateRange === 'all' || orderDate >= startDate;
    });
  };

  const getFilteredExpenses = () => {
    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return dateRange === 'all' || expenseDate >= startDate;
    });
  };

  const filteredOrders = getFilteredOrders();
  const filteredExpenses = getFilteredExpenses();

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const impactFund = totalRevenue * 0.1;
  const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  const getDailyPL = (): DailyP_L[] => {
    const dailyMap: Record<string, DailyP_L> = {};

    filteredOrders.forEach((order) => {
      const date = new Date(order.created_at);
      const dateStr = date.toISOString().split('T')[0];

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          date: dateStr,
          revenue: 0,
          expenses: 0,
          net: 0,
          impact: 0,
          margin: 0,
        };
      }
      dailyMap[dateStr].revenue += order.total_amount || 0;
    });

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const dateStr = date.toISOString().split('T')[0];

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          date: dateStr,
          revenue: 0,
          expenses: 0,
          net: 0,
          impact: 0,
          margin: 0,
        };
      }
      dailyMap[dateStr].expenses += expense.amount;
    });

    return Object.values(dailyMap)
      .map((day) => ({
        ...day,
        impact: day.revenue * 0.1,
        net: day.revenue - day.expenses,
        margin: day.revenue > 0 ? ((day.revenue - day.expenses) / day.revenue) * 100 : 0,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getMonthlyPL = () => {
    const monthlyMap: Record<string, DailyP_L> = {};

    filteredOrders.forEach((order) => {
      const date = new Date(order.created_at);
      const monthStr = date.toISOString().slice(0, 7);

      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = {
          date: monthStr,
          revenue: 0,
          expenses: 0,
          net: 0,
          impact: 0,
          margin: 0,
        };
      }
      monthlyMap[monthStr].revenue += order.total_amount || 0;
    });

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthStr = date.toISOString().slice(0, 7);

      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = {
          date: monthStr,
          revenue: 0,
          expenses: 0,
          net: 0,
          impact: 0,
          margin: 0,
        };
      }
      monthlyMap[monthStr].expenses += expense.amount;
    });

    return Object.values(monthlyMap)
      .map((month) => ({
        ...month,
        impact: month.revenue * 0.1,
        net: month.revenue - month.expenses,
        margin: month.revenue > 0 ? ((month.revenue - month.expenses) / month.revenue) * 100 : 0,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  };

  const expensesByCategory = filteredExpenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleAddExpense = async () => {
    if (!newExpense.description || newExpense.amount <= 0) return;

    try {
      const expenseData = {
        ...newExpense,
        date: new Date(newExpense.date).toISOString(),
        amount: newExpense.gst_applied ? newExpense.amount * 1.05 : newExpense.amount,
        created_at: new Date().toISOString(),
      };

      await addDoc(collection(db, 'expenses'), expenseData);

      setExpenses([
        ...expenses,
        {
          id: Math.random().toString(),
          ...expenseData,
        } as Expense,
      ]);

      setNewExpense({
        description: '',
        amount: 0,
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        gst_applied: false,
      });
      setShowAddExpense(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      setExpenses(expenses.filter((exp) => exp.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const getYTDData = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const ytdOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yearStart;
    });

    const ytdExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= yearStart;
    });

    const ytdRevenue = ytdOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const ytdExpensesTotal = ytdExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const ytdGST = ytdExpenses
      .filter((exp) => exp.gst_applied)
      .reduce((sum, exp) => sum + exp.amount * 0.05, 0);

    return {
      ytdRevenue,
      ytdExpensesTotal,
      ytdGST,
      estimatedTax: (ytdRevenue * 0.25) - ytdGST,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading finances...</div>
      </div>
    );
  }

  const ytdData = getYTDData();
  const dailyPL = getDailyPL();
  const monthlyPL = getMonthlyPL();

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bebas text-white mb-8">Finance & Expenses</h1>

        {/* Date Range Filter */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(['7days', '30days', '90days', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === range
                    ? 'bg-white text-black'
                    : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
                }`}
              >
                {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : range === '90days' ? 'Last 90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* View Selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['daily', 'monthly', 'expenses', 'tax'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setFinanceView(view)}
              className={`px-6 py-2 rounded-xl font-bebas transition ${
                financeView === view
                  ? 'bg-white text-black'
                  : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
              }`}
            >
              {view === 'daily' ? 'Daily P&L' : view === 'monthly' ? 'Monthly P&L' : view === 'expenses' ? 'Expenses' : 'Tax Prep'}
            </button>
          ))}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-white/[0.6] text-xs mb-1">Revenue</p>
            <p className="text-2xl font-bebas text-white">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-white/[0.6] text-xs mb-1">Expenses</p>
            <p className="text-2xl font-bebas text-white">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-white/[0.6] text-xs mb-1">Net Income</p>
            <p className="text-2xl font-bebas text-white">${netIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-white/[0.6] text-xs mb-1">Impact Fund</p>
            <p className="text-2xl font-bebas text-white">${impactFund.toFixed(2)}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-white/[0.6] text-xs mb-1">Margin</p>
            <p className="text-2xl font-bebas text-white">{margin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Daily P&L View */}
        {financeView === 'daily' && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-2xl font-bebas text-white mb-6">Daily P&L</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-4 text-white/[0.6]">Date</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Revenue</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Expenses</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Net</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Impact</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyPL.map((day) => (
                    <tr key={day.date} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                      <td className="py-3 px-4">{day.date}</td>
                      <td className="text-right py-3 px-4">${day.revenue.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">${day.expenses.toFixed(2)}</td>
                      <td className={`text-right py-3 px-4 ${day.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${day.net.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4">${day.impact.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">{day.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly P&L View */}
        {financeView === 'monthly' && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-2xl font-bebas text-white mb-6">Monthly P&L (Last 6 Months)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-4 text-white/[0.6]">Month</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Revenue</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Expenses</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Net</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Impact</th>
                    <th className="text-right py-3 px-4 text-white/[0.6]">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPL.map((month) => (
                    <tr key={month.date} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                      <td className="py-3 px-4">{month.date}</td>
                      <td className="text-right py-3 px-4">${month.revenue.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">${month.expenses.toFixed(2)}</td>
                      <td className={`text-right py-3 px-4 ${month.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${month.net.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4">${month.impact.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">{month.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses View */}
        {financeView === 'expenses' && (
          <div className="space-y-6">
            {/* Add Expense Modal */}
            {showAddExpense && (
              <div className="modal-panel bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <h3 className="text-xl font-bebas text-white mb-4">Add Expense</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Description"
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, description: e.target.value })
                    }
                    className="input-premium w-full bg-white/[0.05] border border-white/[0.08] text-white"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })
                    }
                    className="input-premium w-full bg-white/[0.05] border border-white/[0.08] text-white"
                  />
                  <select
                    value={newExpense.category}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })
                    }
                    className="input-premium w-full bg-white/[0.05] border border-white/[0.08] text-white"
                  >
                    <option value="Shipping">Shipping</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Software">Software</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Legal-Admin">Legal-Admin</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                    className="input-premium w-full bg-white/[0.05] border border-white/[0.08] text-white"
                  />
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={newExpense.gst_applied}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, gst_applied: e.target.checked })
                      }
                    />
                    Apply GST (5%)
                  </label>
                  {newExpense.gst_applied && (
                    <p className="text-sm text-white/[0.6]">
                      Total with GST: ${(newExpense.amount * 1.05).toFixed(2)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddExpense}
                      className="btn-premium flex-1 bg-white text-black hover:bg-white/[0.9]"
                    >
                      Add Expense
                    </button>
                    <button
                      onClick={() => setShowAddExpense(false)}
                      className="btn-premium flex-1 bg-white/[0.1] text-white hover:bg-white/[0.15]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Expense Button */}
            {!showAddExpense && (
              <button
                onClick={() => setShowAddExpense(true)}
                className="btn-premium bg-white text-black hover:bg-white/[0.9]"
              >
                + Add Expense
              </button>
            )}

            {/* Category Summary */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-xl font-bebas text-white mb-4">Expenses by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4">
                    <p className="text-white/[0.6] text-sm mb-1">{category}</p>
                    <p className="text-xl font-bebas text-white">${amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-xl font-bebas text-white mb-4">Recent Expenses</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-white text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-3 px-4 text-white/[0.6]">Date</th>
                      <th className="text-left py-3 px-4 text-white/[0.6]">Description</th>
                      <th className="text-left py-3 px-4 text-white/[0.6]">Category</th>
                      <th className="text-right py-3 px-4 text-white/[0.6]">Amount</th>
                      <th className="text-center py-3 px-4 text-white/[0.6]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses
                      .sort((a, b) => {
                        const dateA = new Date(a.created_at);
                        const dateB = new Date(b.created_at);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map((expense) => (
                        <tr key={expense.id} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{expense.description}</td>
                          <td className="py-3 px-4">{expense.category}</td>
                          <td className="text-right py-3 px-4">${expense.amount.toFixed(2)}</td>
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tax Prep View */}
        {financeView === 'tax' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <p className="text-white/[0.6] text-sm mb-2">YTD Revenue</p>
                <p className="text-3xl font-bebas text-white">${ytdData.ytdRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <p className="text-white/[0.6] text-sm mb-2">YTD Expenses</p>
                <p className="text-3xl font-bebas text-white">${ytdData.ytdExpensesTotal.toFixed(2)}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <p className="text-white/[0.6] text-sm mb-2">GST Credits</p>
                <p className="text-3xl font-bebas text-white">${ytdData.ytdGST.toFixed(2)}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <p className="text-white/[0.6] text-sm mb-2">Est. Tax (25%)</p>
                <p className="text-3xl font-bebas text-white">${ytdData.estimatedTax.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-xl font-bebas text-white mb-4">Tax Notes</h3>
              <p className="text-white/[0.6] text-sm">
                This is an estimate based on current year data. Consult with a tax professional for accurate tax planning and filing.
              </p>
            </div>

            <button
              onClick={() => {
                const csv = `Date,Description,Category,Amount\n${filteredExpenses
                  .map(
                    (exp) =>
                      `${new Date(exp.date).toLocaleDateString()},${exp.description},${exp.category},${exp.amount}`
                  )
                  .join('\n')}`;
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'expenses.csv';
                a.click();
              }}
              className="btn-premium bg-white text-black hover:bg-white/[0.9]"
            >
              Export to CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
