import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './api';

export const getStatus = () => 'ok';

export const getProducts = async () => {
  const querySnapshot = await getDocs(collection(db, 'products'));
  return querySnapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

export const createProduct = async (product) => {
  const payload = {
    nombre: product.nombre,
    categoria: product.categoria,
    cantidad: Number(product.cantidad),
    precio: Number(product.precio),
    piezas: product.piezas || [],
    ganancia: Number(product.ganancia) || 0,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'products'), payload);
  return { id: docRef.id, ...payload };
};

export const updateProduct = async (id, product) => {
  const productRef = doc(db, 'products', id);
  await updateDoc(productRef, {
    nombre: product.nombre,
    categoria: product.categoria,
    cantidad: Number(product.cantidad),
    precio: Number(product.precio),
    piezas: product.piezas || [],
    ganancia: Number(product.ganancia) || 0,
    updatedAt: new Date().toISOString(),
  });

  return { id, ...product };
};

export const deleteProduct = async (id) => {
  await deleteDoc(doc(db, 'products', id));
  return id;
};

const getCollectionDocuments = async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

export const getExpenses = () => getCollectionDocuments('expenses');

export const createExpense = async (expense) => {
  const payload = {
    descripcion: expense.descripcion,
    monto: Number(expense.monto),
    fecha: expense.fecha,
    detalles: expense.detalles || '',
    estado: expense.estado || 'activa',
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'expenses'), payload);
  return { id: docRef.id, ...payload };
};

export const getSales = () => getCollectionDocuments('sales');

export const getClients = () => getCollectionDocuments('clients');

export const createClient = async (client) => {
  const payload = {
    nombre: client.nombre,
    cedula: client.cedula,
    telefono: client.telefono || '',
    correo: client.correo || '',
    direccion: client.direccion || '',
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'clients'), payload);
  return { id: docRef.id, ...payload };
};

export const createSale = async (sale) => {
  const payload = {
    productId: sale.productId,
    producto: sale.producto,
    cantidad: Number(sale.cantidad),
    precioUnitario: Number(sale.precioUnitario),
    total: Number(sale.total),
    fecha: sale.fecha,
    detalles: sale.detalles || '',
    metodoPago: sale.metodoPago || 'efectivo',
    recibido: Number(sale.recibido) || 0,
    vuelto: Number(sale.vuelto) || 0,
    clientId: sale.clientId || '',
    cliente: sale.cliente || '',
    estado: sale.estado || 'activa',
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'sales'), payload);
  return { id: docRef.id, ...payload };
};

export const updateSale = async (id, sale) => {
  const payload = {
    clientId: sale.clientId || '',
    cliente: sale.cliente || '',
    fecha: sale.fecha,
    detalles: sale.detalles || '',
    metodoPago: sale.metodoPago || 'efectivo',
    estado: sale.estado || 'activa',
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, 'sales', id), payload);
  return { id, ...sale, ...payload };
};

export const cancelSale = async (id) => {
  const saleRef = doc(db, 'sales', id);
  const saleSnap = await getDoc(saleRef);

  if (!saleSnap.exists()) {
    throw new Error('La factura no existe');
  }

  const saleData = saleSnap.data();
  if (saleData.estado === 'anulada') {
    return { id, estado: 'anulada', ...saleData };
  }

  if (saleData.productId) {
    const productRef = doc(db, 'products', saleData.productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const currentStock = Number(productSnap.data().cantidad || 0);
      const restoredStock = currentStock + Number(saleData.cantidad || 0);
      await updateDoc(productRef, {
        cantidad: restoredStock,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  await updateDoc(saleRef, { estado: 'anulada', updatedAt: new Date().toISOString() });
  return { id, estado: 'anulada', ...saleData };
};

export const cancelExpense = async (id) => {
  const expenseRef = doc(db, 'expenses', id);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error('El egreso no existe');
  }

  const expenseData = expenseSnap.data();
  if (expenseData.estado === 'anulada') {
    return { id, estado: 'anulada', ...expenseData };
  }

  await updateDoc(expenseRef, { estado: 'anulada', updatedAt: new Date().toISOString() });
  return { id, estado: 'anulada', ...expenseData };
};

export const updateProductStock = async (id, cantidad) => {
  await updateDoc(doc(db, 'products', id), {
    cantidad: Number(cantidad),
    updatedAt: new Date().toISOString(),
  });
};
