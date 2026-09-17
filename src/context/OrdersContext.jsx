import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { readJSON, writeJSON } from '../lib/storage';
import { logError } from '../lib/errorLog';
import { placeOrder } from '../lib/placeOrder';

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

  // Clear sensitive order history on sign-out
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      setOrders([]);
      localStorage.removeItem(STORAGE_KEY_ORDERS);
    }
    prevUserRef.current = user;
  }, [user]);

  // Listen for storage events and internal order updates across tabs and components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key || e.key === STORAGE_KEY_ORDERS || e.type === 'petchup_orders_updated') {
        const disk = readJSON(STORAGE_KEY_ORDERS, []);
        if (Array.isArray(disk)) {
          const clean = disk.filter(o => o && o.id && !["ord-1001", "ord-1002", "ord-1003"].includes(o.id));
          setOrders(clean);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('petchup_orders_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('petchup_orders_updated', handleStorageChange);
    };
  }, []);

  // Sync orders with Supabase for authenticated users or admins
  const syncOrders = useCallback(async () => {
    if (!isConfigured() || !user) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('customer_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;

      if (Array.isArray(data)) {
        const cleanCloud = data.filter(o => !["ord-1001", "ord-1002", "ord-1003"].includes(o.id));
        
        // Merge cloud orders with locally stored disk orders so fallback/local transactions are NEVER wiped
        setOrders(prevOrders => {
          const diskOrders = readJSON(STORAGE_KEY_ORDERS, []) || [];
          const combined = [
            ...cleanCloud,
            ...(prevOrders || []),
            ...(Array.isArray(diskOrders) ? diskOrders : [])
          ];
          
          const map = new Map();
          for (const item of combined) {
            if (item && item.id && !["ord-1001", "ord-1002", "ord-1003"].includes(item.id)) {
              if (!map.has(item.id)) {
                map.set(item.id, item);
              }
            }
          }
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          writeJSON(STORAGE_KEY_ORDERS, merged);
          return merged;
        });
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
    window.dispatchEvent(new CustomEvent('petchup_orders_updated', { detail: newList }));
  };

  const recordNewOrder = (order) => {
    setOrders(prevOrders => {
      const diskOrders = readJSON(STORAGE_KEY_ORDERS, []) || [];
      const combined = [order, ...(prevOrders || []), ...(Array.isArray(diskOrders) ? diskOrders : [])];
      const map = new Map();
      for (const it of combined) {
        if (it && it.id && !["ord-1001", "ord-1002", "ord-1003"].includes(it.id)) {
          if (!map.has(it.id)) map.set(it.id, it);
        }
      }
      const list = Array.from(map.values());
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      writeJSON(STORAGE_KEY_ORDERS, list);
      window.dispatchEvent(new CustomEvent('petchup_orders_updated', { detail: list }));
      return list;
    });
  };

  const createOrder = async (orderData) => {
    if (!isConfigured()) {
      throw new Error("Checkout is unavailable until the store is connected. Your cart has been kept.");
    }

    // Only a confirmed server order can be recorded or shown as successful.
    // Inventory is deducted by place_order, never by a separate browser write.
    const order = await placeOrder(supabase, {
      p_pet_name: orderData.petName || user?.petName || "",
      p_items: orderData.items || [],
      p_discount_code: orderData.discountCode || ""
    });
    recordNewOrder(order);
    return order;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const currentOrder = orders[idx];

    // Client-side guard matching the database state machine
    if (currentOrder.status === 'cancelled' && newStatus !== 'cancelled') {
      throw new Error("Cancelled orders cannot be reopened because returned inventory may have already been allocated to other shoppers.");
    }

    const updated = {
      ...currentOrder,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (isConfigured()) {
      const { error } = await supabase.from('orders').update({
          status: newStatus,
          updated_at: updated.updated_at
        }).eq('id', orderId);
      if (error) throw error;
    } else {
      // Offline fallback: restore inventory in localStorage if transitioning to cancelled
      if (currentOrder.status !== 'cancelled' && newStatus === 'cancelled' && Array.isArray(currentOrder.items)) {
        try {
          const prods = readJSON("petchup_products", []);
          let changed = false;
          currentOrder.items.forEach(it => {
            const pIdx = prods.findIndex(p => p.id === it.id);
            if (pIdx !== -1) {
              prods[pIdx].stockQuantity = (prods[pIdx].stockQuantity || 0) + (it.qty || 1);
              prods[pIdx].inStock = true;
              changed = true;
            }
          });
          if (changed) writeJSON("petchup_products", prods);
        } catch (_) {}
      }
    }

    const updatedList = [...orders];
    updatedList[idx] = updated;
    saveOrdersList(updatedList);

    return updated;
  };

  const deleteOrder = async (orderId) => {
    const target = orders.find(o => o.id === orderId);
    if (isConfigured()) {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
    } else if (target && target.status !== 'cancelled' && Array.isArray(target.items)) {
      // Offline fallback: restore inventory if deleting an active uncancelled order
      try {
        const prods = readJSON("petchup_products", []);
        let changed = false;
        target.items.forEach(it => {
          const pIdx = prods.findIndex(p => p.id === it.id);
          if (pIdx !== -1) {
            prods[pIdx].stockQuantity = (prods[pIdx].stockQuantity || 0) + (it.qty || 1);
            prods[pIdx].inStock = true;
            changed = true;
          }
        });
        if (changed) writeJSON("petchup_products", prods);
      } catch (_) {}
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
