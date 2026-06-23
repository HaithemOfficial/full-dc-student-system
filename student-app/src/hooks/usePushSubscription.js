import { useEffect } from 'react';
import api from '../utils/api';

const VAPID_PUBLIC_KEY = 'BDA4gVgIYCGg4gDyDrK2zs7RIutrOBMf-_6qkFc4nCmDfHa5scIPcBrNYKjiPoM-5KiIg1RfUIBll6AfaN_7EjY';
const DISMISSED_KEY = 'push_dismissed';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function subscribe() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) return;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    api.post('/student/me/push-subscription', { subscription: existing.toJSON() }).catch(() => {});
    return;
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  api.post('/student/me/push-subscription', { subscription: sub.toJSON() }).catch(() => {});
}

export function usePushSubscription() {
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      subscribe();
      return;
    }
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Permission not yet requested — handled via the prompt banner
  }, []);
}

export async function requestPushPermission() {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await subscribe();
    return true;
  }
  localStorage.setItem(DISMISSED_KEY, '1');
  return false;
}

export function dismissPushPrompt() {
  localStorage.setItem(DISMISSED_KEY, '1');
}

export function shouldShowPushPrompt() {
  if (!('Notification' in window) || !('PushManager' in window)) return false;
  if (Notification.permission !== 'default') return false;
  if (localStorage.getItem(DISMISSED_KEY)) return false;
  return true;
}
