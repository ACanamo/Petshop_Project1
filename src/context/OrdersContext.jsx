import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { readJSON, writeJSON } from '../lib/storage';
import { logError } from '../lib/errorLog';

const OrdersContext = createContext();

const STORAGE_KEY_ORDERS = "petchup_orders";
const MIGRATION_KEY_CLEAN_ORDERS = "petchup_orders_blank_init_v3";

export function OrdersProvider({ children }) {
  const { user, isAdmin } = useAuth();

  const [orders, setOrders] = useState(() => {
    try {
      if (!localStorage.getItem(MIGRATION_KEY_CLEAN_ORDERS)) {
        localStorage.removeItem(STORAGE_KEY_ORDERS);
        localStorage.setItem(MIGRATION_KEY_CLEAN_ORDERS, "true");
        return [];
      }
      const parsed = readJSON(STORAGE_KEY_ORDERS, null);
      if (Array.isArray(parsed)) {
        return parsed.filter(o => o.id && !["ord-1001", "ord-1002", "ord-1003"].includes(o.id));
      }
    } catch (_) {}
    return [];
  });

  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Clear orders in state and local storage when a user signs out or session ends
  // to avoid leaking purchase history to a guest or next user on a shared device.
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      setOrders([]);
      localStorage.removeItem(STORAGE_KEY_ORDERS);
    }
    prevUserRef.current = user;
  }, [user]);

  // Sync orders with Supabase
  const syncOrders = useCallback(async () => {
    if (!isConfigured() || !user) return;
    setLoadingOrders(true);

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) query = query.eq('customer_id', user.id);
      const { data, error } = await query;
      if (error) throw error;

      if (Array.isArray(data)) {
        const cleanCloud = data.filter(o => !["ord-1001", "ord-1002", "ord-1003"].includes(o.id));
        setOrders(cleanCloud);
        writeJSON(STORAGE_KEY_ORDERS, cleanCloud);
      }
    } catch (err) {
      logError('OrdersContext.syncOrders', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    syncOrders();
  }, [syncOrders]);

  const saveOrdersList = (newList) => {
    setOrders(newList);
    writeJSON(STORAGE_KEY_ORDERS, newList);
  };

  const createOrder = async (orderData) => {
    const items = orderData.items || [];
    const customerId = orderData.customerId || user?.id || null;
    const customerName = orderData.customerName || user?.name || "Guest Pet Parent";
    const customerEmail = orderData.customerEmail || user?.email || "";
    const petName = orderData.petName || user?.petName || "";
    const discountCode = orderData.discountCode || "";

    if (isConfigured()) {
      // place_order() decrements product stock and inserts the order in one
      // Postgres transaction, rejects the whole checkout if any item doesn't
      // have enough stock left, and enforces one-time-per-customer coupon
      // redemption — see supabase_schema.sql section 14. It derives the
      // order's id, customer_id, customer_name and customer_email itself
      // from the caller's own session/profile — none of that is accepted
      // from the client (only descriptive, non-identity fields are).
      const { data, error } = await supabase.rpc('place_order', {
        p_pet_name: petName,
        p_items: items,
        p_discount_code: discountCode
      });
      if (error) throw new Error(error.message || "Could not save the order.");

      const updatedList = [data, ...orders];
      saveOrdersList(updatedList);
      return data;
    }

    // Offline / local fallback — no server-side stock table to reconcile.
    const newOrder = {
      id: "ord-" + Date.now(),
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      pet_name: petName,
      items,
      item_count: items.reduce((sum, it) => sum + (it.qty || 1), 0),
      subtotal: parseFloat(Number(orderData.subtotal || 0).toFixed(2)),
      discount_code: discountCode,
      discount_amount: parseFloat(Number(orderData.discountAmount || 0).toFixed(2)),
      total: parseFloat(Number(orderData.total || 0).toFixed(2)),
      status: "pending",
      created_at: new Date().toISOString()
    };

    const updatedList = [newOrder, ...orders];
    saveOrdersList(updatedList);

    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const updated = {
      ...orders[idx],
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (isConfigured()) {
      const { error } = await supabase.from('orders').update({
          status: newStatus,
          updated_at: updated.updated_at
        }).eq('id', orderId);
      if (error) throw error;
    }

    const updatedList = [...orders];
    updatedList[idx] = updated;
    saveOrdersList(updatedList);

    return updated;
  };

  const deleteOrder = async (orderId) => {
    if (isConfigured()) {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
    }

    const updatedList = orders.filter(o => o.id !== orderId);
    saveOrdersList(updatedList);
  };

  const clearAllOrders = async () => {
    if (isConfigured()) {
      const orderIds = orders.map(order => order.id);
      if (orderIds.length) {
        const { error } = await supabase.from('orders').delete().in('id', orderIds);
        if (error) throw error;
      }
    }
    saveOrdersList([]);
  };

  // Filter orders for active user
  const customerOrders = orders.filter(o => {
    if (!user) return false;
    const matchEmail = user.email && o.customer_email && o.customer_email.toLowerCase() === user.email.toLowerCase();
    const matchId = user.id && o.customer_id === user.id;
    return matchEmail || matchId;
  });

  const openOrderHistory = () => setIsOrderHistoryOpen(true);
  const closeOrderHistory = () => setIsOrderHistoryOpen(false);

  const openInvoice = (order) => setSelectedInvoiceOrder(order);
  const closeInvoice = () => setSelectedInvoiceOrder(null);

  return (
    <OrdersContext.Provider value={{
      orders,
      customerOrders,
      loadingOrders,
      isOrderHistoryOpen,
      selectedInvoiceOrder,
      createOrder,
      updateOrderStatus,
      deleteOrder,
      clearAllOrders,
      openOrderHistory,
      closeOrderHistory,
      openInvoice,
      closeInvoice,
      syncOrders
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within an OrdersProvider");
  return context;
}
