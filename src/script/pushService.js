import { vapidPubKey } from './constants.js';
import urlBase64ToUint8Array from './urlBase64ToUint8Array.js';
export default class PushService {
  constructor(swRegistration) {
    this.swRegistration = swRegistration;
  }

  async subscribeToUpdates() {
    const applicationServerKey = urlBase64ToUint8Array(vapidPubKey);
    const subscription = await this.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    this.updateSubscriptionToServer(subscription);
  }

  async unsubscribeFromUpdates() {
    const subscription = await this.getSubscription();
    try {
      subscription.unsubscribe();
    } catch (err) {
      log(err);
    } finally {
      this.updateSubscriptionToServer(null);
      this.subscription = null;
    }
  }

  async getSubscription() {
    if (!this.subscription) {
      this.subscription = await this.swRegistration.pushManager.getSubscription();
    }
    return this.subscription;
  }

  async isSubscribed() {
    return (await this.getSubscription()) !== null;
  }

  async updateSubscriptionToServer(subscription) {
    // TODO implement
    console.log(
      'Server call not implemented. Send this to your server:',
      JSON.stringify(subscription)
    );
  }

  async showNotification(title, options) {
    const fullOptions = Object.assign(
      {},
      {
        body: '',
        icon: 'img/icons/icon-128x128.png',
        badge: 'img/icons/icon-128x128.png'
      },
      options
    );

    this.swRegistration.showNotification(title, fullOptions);
  }
}
