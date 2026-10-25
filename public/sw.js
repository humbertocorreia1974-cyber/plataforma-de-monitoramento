// Service worker dedicado a Web Push (VAPID). Não faz cache de assets —
// só escuta eventos de push e clique na notificação.
self.addEventListener("push", (event) => {
  let data = { title: "Plataforma de Monitoramento", body: "Novo alerta." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // payload não era JSON — mantém o fallback acima
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      data: { url: data.url || "/operacao" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/operacao";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
