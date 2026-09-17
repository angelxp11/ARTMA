import { getActiveExpensesTotal, getActiveSalesTotal, getRestoredStock } from './server/logic';

test('las ventas y egresos anulados no suman al balance y el stock vuelve al total correcto', () => {
  const sales = [
    { total: 1000, estado: 'activa' },
    { total: 250, estado: 'anulada' },
  ];
  const expenses = [
    { monto: 300, estado: 'activa' },
    { monto: 75, estado: 'anulada' },
  ];

  expect(getActiveSalesTotal(sales)).toBe(1000);
  expect(getActiveExpensesTotal(expenses)).toBe(300);
  expect(getRestoredStock(10, 3)).toBe(13);
});
