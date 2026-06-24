const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/notifications/vapid-public-key`)
    const data = await res.json()
    return data.publicKey ?? null
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}

export async function subscribeToPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const vapidKey = await getVapidPublicKey()
  if (!vapidKey) return false

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }

    const token = await getToken()
    await fetch(`${API_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ endpoint, keys }),
    })

    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  const token = await getToken()
  await fetch(`${API_URL}/notifications/unsubscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })

  await subscription.unsubscribe()
}
