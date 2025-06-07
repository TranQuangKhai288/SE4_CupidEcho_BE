export interface MessageObserver {
  notify(message: any, context: any): Promise<void>;
}

export class MessageSubject {
  private observers: MessageObserver[] = [];

  addObserver(observer: MessageObserver) {
    this.observers.push(observer);
  }

  async notifyAll(message: any, context: any) {
    for (const observer of this.observers) {
      await observer.notify(message, context);
    }
  }
}
