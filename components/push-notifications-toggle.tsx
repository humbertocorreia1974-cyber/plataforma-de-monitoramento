"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BellRing, BellOff } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// Botão opt-in explícito — nunca dispara o prompt de permissão sozinho.
// Usado na Central de Operação, onde operadores e admins recebem alertas.
export function PushNotificationsToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  async function ativar() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Notificações push ainda não configuradas neste ambiente.");
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.message("Permissão de notificação não concedida.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setSubscribed(true);
      toast.success("Notificações ativadas neste navegador.");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível ativar as notificações.");
    } finally {
      setLoading(false);
    }
  }

  async function desativar() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setSubscribed(false);
      toast.message("Notificações desativadas.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return subscribed ? (
    <Button variant="secondary" size="sm" onClick={desativar} disabled={loading}>
      <BellRing className="h-4 w-4" />
      Notificações ativas
    </Button>
  ) : (
    <Button variant="secondary" size="sm" onClick={ativar} disabled={loading}>
      <BellOff className="h-4 w-4" />
      Ativar notificações
    </Button>
  );
}
