import PushService from './script/pushService.js';
import './styles.css';

window.addEventListener('load', e => {
  new PWAConfApp();
});
class PWAConfApp {
  constructor() {
    this.init();
  }
  async init() {
    this.setupNavIntersectionObserver();
    this.addLoadingIndicatorDelay();

    this.loadSpeakers();
    this.loadSchedule();

    await this.registerSW();
    await this.initPush();
  }

  async loadSpeakers() {
    this.speakers = (await import('./speakers.json')).default;
    const speakersDiv = document.querySelector('.speakers');

    speakersDiv.innerHTML = this.speakers.map(this.toSpeakerBlock).join('\n');
  }

  async loadSchedule() {
    const rawSchedule = (await import('./schedule.json')).default;
    // Add speaker details to array
    const schedule = rawSchedule.map(this.addSpeakerDetails, this);
    const scheduleDiv = document.querySelector('.schedule');
    scheduleDiv.innerHTML = schedule.map(this.toScheduleBlock).join('\n');
  }

  toSpeakerBlock(speaker) {
    return `
        <div class="speaker">
          <img src="${speaker.picture}" alt="${speaker.name}">
          <div>${speaker.name}</div>
        </div>`;
  }

  toScheduleBlock(scheduleItem) {
    return `
      <div class="schedule-item ${scheduleItem.category}">
        <div class="title-and-time">
          <div class="time">${scheduleItem.startTime}</div>
          <div class="title-and-speaker">
            <div class="title">${scheduleItem.title}</div>
            <div class="speaker">${
              scheduleItem.speaker ? scheduleItem.speaker.name : '&nbsp;'
            }</div>
          </div>
        </div>
        <p class="description">${scheduleItem.description}</p>
      </div>
    `;
  }

  addSpeakerDetails(item) {
    if (item.speakerId) {
      return Object.assign({}, item, {
        speaker: this.speakers.find(s => s.id === item.speakerId)
      });
    }
    return Object.assign({}, item);
  }

  addLoadingIndicatorDelay() {
    // Only show spinner if we're delayed more than 1s
    setTimeout(() => {
      Array.from(document.querySelectorAll('.loader')).forEach(loader => {
        loader.removeAttribute('hidden');
      });
    }, 1000);
  }

  setupNavIntersectionObserver() {
    if (!'IntersectionObserver' in window) return;

    const nav = document.querySelector('nav');
    const header = document.querySelector('header');
    const callback = entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          [nav, header].forEach(e => e.classList.remove('fixed'));
        } else {
          [nav, header].forEach(e => e.classList.add('fixed'));
        }
      });
    };
    const observer = new IntersectionObserver(callback, {
      threshold: [0, 1]
    });
    observer.observe(header);
  }

  async registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        const swRegistration = await navigator.serviceWorker.register(
          './sw.js'
        );
        if ('PushManager' in window) {
          this.pushService = new PushService(swRegistration);
        }
      } catch (e) {
        console.log('ServiceWorker registration failed. Sorry about that.', e);
      }
    } else {
      document.querySelector('.alert').removeAttribute('hidden');
    }
  }

  async initPush() {
    this.updatesButton = document.querySelector('#updates');
    this.updatesButton.addEventListener('click', async e => {
      this.updatesButton.disabled = true;

      if (await this.pushService.isSubscribed()) {
        await this.pushService.unsubscribeFromUpdates();
        this.updateButtonState();
      } else {
        try {
          await this.pushService.subscribeToUpdates();
          this.pushService.showNotification('Subscribed to updates');
        } catch (err) {
          console.log(err);
        } finally {
          this.updateButtonState();
        }
      }
    });
    this.updateButtonState();
  }

  async updateButtonState() {
    if (Notification.permission !== 'denied') {
      if (await this.pushService.isSubscribed()) {
        this.updatesButton.textContent = 'Disable notifications';
      } else {
        this.updatesButton.textContent = 'Enable notifications';
      }
      this.updatesButton.disabled = false;
      this.updatesButton.removeAttribute('hidden');
    } else {
      this.updatesButton.parentElement.removeChild(this.updatesButton);
    }
  }
}
