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

  // Preserve local order history so checkout transactions placed during testing,
  // offline sessions, or fallback mode remain visible in the Admin Panel across logins.
  const prevUserRef = useRef(user);
  useEffect(() => {
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

  // Sync orders with Supabase without ever erasing local disk orders
  const syncOrders = useCallback(async () => {
    if (!isConfigured()) return;
    setLoadingOrders(true);

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
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
    const items = orderData.items || [];
    const customerId = orderData.customerId || user?.id || null;
    const customerName = orderData.customerName || user?.name || "Guest Pet Parent";
    const customerEmail = orderData.customerEmail || user?.email || "";
    const petName = orderData.petName || user?.petName || "";
    const discountCode = orderData.discountCode || "";

    if (isConfigured()) {
      try {
        // Wrap place_order in a 6-second timeout so the UI never hangs indefinitely on "Processing..."
        const rpcPromise = supabase.rpc('place_order', {
          p_pet_name: petName,
          p_items: items,
          p_discount_code: discountCode
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Supabase RPC timeout")), 6000)
        );

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

        if (error) {
          // If it's a real inventory or coupon rule rejection, throw so CartDrawer displays the clear warning
          const isBusinessRule =
            error.message?.includes("Not enough stock") ||
            error.message?.includes("used the coupon") ||
            error.message?.includes("Invalid item quantity") ||
            error.message?.includes("Order must contain at least one item") ||
            error.message?.includes("Too many orders placed recently");

          if (isBusinessRule) {
            throw new Error(error.message);
          }

          // Otherwise (e.g. permission denied, network stall, or unknown product id), log and fall back to offline creation
          logError('OrdersContext.place_order_cloud_fallback', error);
        } else if (data) {
          recordNewOrder(data);
          return data;
        }
      } catch (err) {
        // Preserve business rule rejections
        const isBusinessRule =
          err.message?.includes("Not enough stock") ||
          err.message?.includes("used the coupon") ||
          err.message?.includes("Invalid item quantity") ||
          err.message?.includes("Order must contain at least one item") ||
          err.message?.includes("Too many orders placed recently");

        if (isBusinessRule) throw err;

        logError('OrdersContext.createOrder_fallback', err);
      }
    }

    // Offline / local fallback — guarantees checkout always succeeds and proceeds to invoice modal
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

    // Deduct stock in localStorage for offline consistency
    try {
      const prods = readJSON("petchup_products", []);
      let changed = false;
      items.forEach(it => {
        const pIdx = prods.findIndex(p => p.id === it.id);
        if (pIdx !== -1) {
          const deductQty = parseInt(it.qty, 10) || 1;
          const newQty = Math.max(0, (prods[pIdx].stockQuantity ?? 10) - deductQty);
          prods[pIdx].stockQuantity = newQty;
          prods[pIdx].inStock = newQty > 0;
          changed = true;
        }
      });
      if (changed) writeJSON("petchup_products", prods);
    } catch (_) {}

    recordNewOrder(newOrder);
    return newOrder;
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
