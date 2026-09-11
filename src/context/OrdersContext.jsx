import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(o => o.id && !["ord-1001", "ord-1002", "ord-1003"].includes(o.id));
        }
      }
    } catch (_) {}
    return [];
  });

  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

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
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(cleanCloud));
      }
    } catch (err) {
      console.warn("Could not sync orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    syncOrders();
  }, [syncOrders]);

  const saveOrdersList = (newList) => {
    setOrders(newList);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(newList));
  };

  const createOrder = async (orderData) => {
    const newOrder = {
      id: "ord-" + Date.now(),
      customer_id: orderData.customerId || user?.id || null,
      customer_name: orderData.customerName || user?.name || "Guest Pet Parent",
      customer_email: orderData.customerEmail || user?.email || "",
      pet_name: orderData.petName || user?.petName || "",
      items: orderData.items || [],
      item_count: (orderData.items || []).reduce((sum, it) => sum + (it.qty || 1), 0),
      subtotal: parseFloat(Number(orderData.subtotal || 0).toFixed(2)),
      discount_code: orderData.discountCode || "",
      discount_amount: parseFloat(Number(orderData.discountAmount || 0).toFixed(2)),
      total: parseFloat(Number(orderData.total || 0).toFixed(2)),
      status: "pending",
      created_at: new Date().toISOString()
    };

    if (isConfigured()) {
      try {
        const { error } = await supabase.from('orders').insert({
          id: newOrder.id,
          customer_id: newOrder.customer_id,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email,
          pet_name: newOrder.pet_name,
          items: newOrder.items,
          item_count: newOrder.item_count,
          subtotal: newOrder.subtotal,
          discount_code: newOrder.discount_code,
          discount_amount: newOrder.discount_amount,
          total: newOrder.total,
          status: newOrder.status,
          created_at: newOrder.created_at
        });
        if (error) throw error;
      } catch (err) {
        throw new Error(err.message || "Could not save the order.");
      }
    }

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
