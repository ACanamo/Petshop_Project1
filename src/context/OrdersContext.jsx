import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { readJSON, writeJSON } from '../lib/storage';
import { logError } from '../lib/errorLog';
import { placeOrder } from '../lib/placeOrder';
import { validateOrderTransition } from '../lib/orderLifecycle';

import { getUserOrderStorageKey } from '../lib/sessionManager';

const OrdersContext = createContext();

export function OrdersProvider({ children }) {
  const { user, isAdmin, sessionGeneration } = useAuth();
  const storageKey = getUserOrderStorageKey(user?.id);

  const [orders, setOrders] = useState(() => {
    try {
      const parsed = readJSON(storageKey, null);
      if (Array.isArray(parsed)) {
        return parsed.filter(o => o.id && !["ord-1001", "ord-1002", "ord-1003"].includes(o.id));
      }
    } catch (_) {}
    return [];
  });

  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Clear sensitive order history and open modals on sign-out or account switch
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current?.id !== user?.id) {
      setOrders([]);
      setSelectedInvoiceOrder(null);
      setIsOrderHistoryOpen(false);
    }
    prevUserRef.current = user;
  }, [user]);

  // Listen for global session cleared event
  useEffect(() => {
    const handleSessionCleared = () => {
      setOrders([]);
      setSelectedInvoiceOrder(null);
      setIsOrderHistoryOpen(false);
    };

    window.addEventListener('petchup_session_cleared', handleSessionCleared);
    return () => window.removeEventListener('petchup_session_cleared', handleSessionCleared);
  }, []);

  // Listen for storage events and internal order updates across tabs and components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key || e.key === storageKey || e.type === 'petchup_orders_updated') {
        const disk = readJSON(storageKey, []);
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
  }, [storageKey]);

  // Sync orders with Supabase for authenticated users or admins
  const syncOrders = useCallback(async () => {
    if (!isConfigured() || !user) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    const activeGen = sessionGeneration;

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

      // Discard stale response if session changed or user signed out while query was in flight
      if (activeGen !== sessionGeneration || !user) return;

      if (Array.isArray(data)) {
        const cleanCloud = data.filter(o => !["ord-1001", "ord-1002", "ord-1003"].includes(o.id));
        
        // Merge cloud orders with locally stored disk orders for THIS user
        setOrders(prevOrders => {
          const diskOrders = readJSON(storageKey, []) || [];
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
          writeJSON(storageKey, merged);
          return merged;
        });
      }
    } catch (err) {
      logError('OrdersContext.syncOrders', err);
    } finally {
      if (activeGen === sessionGeneration) {
        setLoadingOrders(false);
      }
    }
  }, [isAdmin, user, sessionGeneration, storageKey]);

  useEffect(() => {
    syncOrders();
  }, [syncOrders]);

  const saveOrdersList = (newList) => {
    setOrders(newList);
    writeJSON(storageKey, newList);
    window.dispatchEvent(new CustomEvent('petchup_orders_updated', { detail: newList }));
  };

  const recordNewOrder = (order) => {
    setOrders(prevOrders => {
      const diskOrders = readJSON(storageKey, []) || [];
      const combined = [order, ...(prevOrders || []), ...(Array.isArray(diskOrders) ? diskOrders : [])];
      const map = new Map();
      for (const it of combined) {
        if (it && it.id && !["ord-1001", "ord-1002", "ord-1003"].includes(it.id)) {
          if (!map.has(it.id)) map.set(it.id, it);
        }
      }
      const list = Array.from(map.values());
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      writeJSON(storageKey, list);
      window.dispatchEvent(new CustomEvent('petchup_orders_updated', { detail: list }));
      return list;
    });
  };

  const createOrder = async (orderData) => {
    if (!isConfigured()) {
      throw new Error("Checkout is unavailable until the store is connected. Your cart has been kept.");
    }

    const attemptKey = orderData.attemptKey || null;

    // 1. Proactive check for already committed attempt before re-calling RPC if retrying
    if (attemptKey && user?.id) {
      try {
        const { data: existing } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user.id)
          .eq('checkout_attempt_key', attemptKey)
          .maybeSingle();

        if (existing?.id) {
          recordNewOrder(existing);
          return existing;
        }
      } catch (_) {}
    }

    // Only a confirmed server order can be recorded or shown as successful.
    // Inventory is deducted by place_order, never by a separate browser write.
    try {
      const params = {
        p_pet_name: orderData.petName || user?.petName || "",
        p_items: orderData.items || [],
        p_discount_code: orderData.discountCode || ""
      };
      if (attemptKey) {
        params.p_attempt_key = attemptKey;
      }

      const order = await placeOrder(supabase, params);
      recordNewOrder(order);
      return order;
    } catch (err) {
      // Reconcile unknown / timed-out outcomes explicitly:
      // Check if the order was actually committed before failing
      if (attemptKey && user?.id) {
        try {
          const { data: committed } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', user.id)
            .eq('checkout_attempt_key', attemptKey)
            .maybeSingle();

          if (committed?.id) {
            recordNewOrder(committed);
            return committed;
          }
        } catch (_) {}
      }
      throw err;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const currentOrder = orders[idx];

    // 1. Enforce strict state machine rules (delivered/cancelled are terminal; no illegal skips or backwards movement)
    validateOrderTransition(currentOrder.status, newStatus);

    const isCancelling = newStatus === 'cancelled' && currentOrder.status !== 'cancelled';
    // 2. Idempotent restocking: only return inventory once
    const shouldRestock = isCancelling && !currentOrder.restocked;

    const updated = {
      ...currentOrder,
      status: newStatus,
      restocked: currentOrder.restocked || shouldRestock,
      cancelled_at: isCancelling ? (currentOrder.cancelled_at || new Date().toISOString()) : currentOrder.cancelled_at,
      updated_at: new Date().toISOString()
    };

    if (isConfigured()) {
      const { error } = await supabase.from('orders').update({
        status: newStatus,
        restocked: updated.restocked,
        cancelled_at: updated.cancelled_at || null,
        updated_at: updated.updated_at
      }).eq('id', orderId);
      if (error) throw error;
    }

    // Restock inventory safely once
    if (shouldRestock && Array.isArray(currentOrder.items)) {
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

    const updatedList = [...orders];
    updatedList[idx] = updated;
    saveOrdersList(updatedList);

    return updated;
  };

  const archiveOrder = async (orderId) => {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const currentOrder = orders[idx];
    const now = new Date().toISOString();
    const updated = {
      ...currentOrder,
      is_archived: true,
      archived_at: now,
      updated_at: now
    };

    if (isConfigured()) {
      const { error } = await supabase.from('orders').update({
        is_archived: true,
        archived_at: now,
        updated_at: now
      }).eq('id', orderId);
      if (error) throw error;
    }

    const updatedList = [...orders];
    updatedList[idx] = updated;
    saveOrdersList(updatedList);
    return updated;
  };

  const unarchiveOrder = async (orderId) => {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const currentOrder = orders[idx];
    const now = new Date().toISOString();
    const updated = {
      ...currentOrder,
      is_archived: false,
      archived_at: null,
      updated_at: now
    };

    if (isConfigured()) {
      const { error } = await supabase.from('orders').update({
        is_archived: false,
        archived_at: null,
        updated_at: now
      }).eq('id', orderId);
      if (error) throw error;
    }

    const updatedList = [...orders];
    updatedList[idx] = updated;
    saveOrdersList(updatedList);
    return updated;
  };

  // Safe archival replacing destructive hard deletion.
  // Preserves financial audit trails, invoice history, and customer receipts.
  const deleteOrder = async (orderId) => {
    return archiveOrder(orderId);
  };

  const archiveCompletedOrders = async () => {
    const eligible = orders.filter(o => !o.is_archived && (o.status === 'delivered' || o.status === 'cancelled'));
    if (eligible.length === 0) return;

    const now = new Date().toISOString();
    const eligibleIds = eligible.map(o => o.id);

    if (isConfigured()) {
      const { error } = await supabase.from('orders').update({
        is_archived: true,
        archived_at: now,
        updated_at: now
      }).in('id', eligibleIds);
      if (error) throw error;
    }

    const updatedList = orders.map(o => (
      eligibleIds.includes(o.id) ? { ...o, is_archived: true, archived_at: now } : o
    ));
    saveOrdersList(updatedList);
  };

  const clearAllOrders = async () => {
    // For safety, clearAllOrders now archives completed orders instead of wiping the table
    return archiveCompletedOrders();
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
      archiveOrder,
      unarchiveOrder,
      deleteOrder,
      archiveCompletedOrders,
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
