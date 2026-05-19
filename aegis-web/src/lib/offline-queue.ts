import { get, set } from 'idb-keyval';

export interface QueuedAction {
  id: string;
  type: 'chat' | 'voice' | 'wizard' | 'assessment';
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = 'aegis-offline-queue';

export async function getOfflineQueue(): Promise<QueuedAction[]> {
  return (await get<QueuedAction[]>(QUEUE_KEY)) || [];
}

export async function queueOfflineAction(type: QueuedAction['type'], payload: any): Promise<void> {
  const queue = await getOfflineQueue();
  const newAction: QueuedAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
  };
  await set(QUEUE_KEY, [...queue, newAction]);
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('offline-queue-updated'));
}

export async function removeOfflineAction(id: string): Promise<void> {
  const queue = await getOfflineQueue();
  const updatedQueue = queue.filter(action => action.id !== id);
  await set(QUEUE_KEY, updatedQueue);
  window.dispatchEvent(new CustomEvent('offline-queue-updated'));
}

export async function clearOfflineQueue(): Promise<void> {
  await set(QUEUE_KEY, []);
  window.dispatchEvent(new CustomEvent('offline-queue-updated'));
}
