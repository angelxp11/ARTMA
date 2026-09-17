export const getActiveSalesTotal = (sales = []) => sales
  .filter(sale => sale && sale.estado !== 'anulada')
  .reduce((total, sale) => total + Number(sale.total || 0), 0);

export const getActiveExpensesTotal = (expenses = []) => expenses
  .filter(expense => expense && expense.estado !== 'anulada')
  .reduce((total, expense) => total + Number(expense.monto || 0), 0);

export const getRestoredStock = (currentStock = 0, quantity = 0) => Number(currentStock || 0) + Number(quantity || 0);
