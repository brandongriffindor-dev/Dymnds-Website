type ObserverCallback = (isIntersecting: boolean) => void;

const observers = new Map<number, {
  observer: IntersectionObserver;
  entries: Map<Element, ObserverCallback>;
}>();

export function observe(element: Element, callback: ObserverCallback, threshold: number = 0.15): () => void {
  let record = observers.get(threshold);

  if (!record) {
    const entries = new Map<Element, ObserverCallback>();
    const observer = new IntersectionObserver(
      (observerEntries) => {
        for (const entry of observerEntries) {
          const cb = entries.get(entry.target);
          if (cb) {
            cb(entry.isIntersecting);
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
              entries.delete(entry.target);
            }
          }
        }
      },
      { threshold }
    );
    record = { observer, entries };
    observers.set(threshold, record);
  }

  record.entries.set(element, callback);
  record.observer.observe(element);

  return () => {
    record!.observer.unobserve(element);
    record!.entries.delete(element);
  };
}
