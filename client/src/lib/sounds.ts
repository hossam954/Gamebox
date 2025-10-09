
// Sound manager for background music and game effects
class SoundManager {
  private backgroundMusic: HTMLAudioElement | null = null;
  private winSound: HTMLAudioElement | null = null;
  private loseSound: HTMLAudioElement | null = null;
  private openingSound: HTMLAudioElement | null = null;
  private clickSound: HTMLAudioElement | null = null;
  private notificationSound: HTMLAudioElement | null = null;

  constructor() {
    // Initialize background music (looping) - موسيقى خلفية لعبة مناسبة
    this.backgroundMusic = new Audio('https://assets.mixkit.co/active_storage/sfx/2745/2745.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.15;

    // Win sound effect - صوت ربح مميز
    this.winSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    this.winSound.volume = 0.6;

    // Lose sound effect - صوت خسارة مناسب
    this.loseSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3');
    this.loseSound.volume = 0.4;

    // Box opening sound - صوت فتح الصندوق
    this.openingSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    this.openingSound.volume = 0.5;

    // Click/button sound - صوت نقرة بسيط
    this.clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3');
    this.clickSound.volume = 0.3;

    // Notification sound - صوت إشعار
    this.notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    this.notificationSound.volume = 0.4;
  }

  playBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(err => {
        console.log('Background music autoplay prevented:', err);
      });
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  playWin() {
    if (this.winSound) {
      this.winSound.currentTime = 0;
      this.winSound.play().catch(err => console.log('Win sound error:', err));
    }
  }

  playLose() {
    if (this.loseSound) {
      this.loseSound.currentTime = 0;
      this.loseSound.play().catch(err => console.log('Lose sound error:', err));
    }
  }

  playOpening() {
    if (this.openingSound) {
      this.openingSound.currentTime = 0;
      this.openingSound.play().catch(err => console.log('Opening sound error:', err));
    }
  }

  playClick() {
    if (this.clickSound) {
      // إنشاء نسخة جديدة للسماح بتشغيل متعدد
      const sound = this.clickSound.cloneNode(true) as HTMLAudioElement;
      sound.volume = 0.3;
      sound.play().catch(err => console.log('Click sound error:', err));
    }
  }

  playNotification() {
    if (this.notificationSound) {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(err => console.log('Notification sound error:', err));
    }
  }

  setVolume(type: 'background' | 'effects', volume: number) {
    const vol = Math.max(0, Math.min(1, volume));
    
    if (type === 'background' && this.backgroundMusic) {
      this.backgroundMusic.volume = vol;
    } else if (type === 'effects') {
      if (this.winSound) this.winSound.volume = vol;
      if (this.loseSound) this.loseSound.volume = vol;
      if (this.openingSound) this.openingSound.volume = vol;
      if (this.clickSound) this.clickSound.volume = vol;
      if (this.notificationSound) this.notificationSound.volume = vol;
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
