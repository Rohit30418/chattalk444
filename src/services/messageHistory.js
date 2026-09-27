// Preserve messages arriving over sockets while a history request is pending.
export const mergeMessages = (older, current) => {
  const key = (message) => String(message.id || message._id || message.clientId || '');
  const combined = new Map(older.map((message) => [key(message), message]));
  current.forEach((message) => combined.set(key(message), message));
  return Array.from(combined.values()).sort((a, b) => (
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  ));
};
