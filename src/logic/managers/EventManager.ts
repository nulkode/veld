type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events: { [key: string]: EventListener[] };

  constructor() {
    this.events = {};
  }

  on(event: string, listener: EventListener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.events[event];

    if (listeners) {
      listeners.forEach(listener => {
        listener(...args);
      });
    }
  }

  off(event: string, listener: EventListener) {
    const listeners = this.events[event];

    if (listeners) {
      this.events[event] = listeners.filter(l => l !== listener);
    }
  }
}
