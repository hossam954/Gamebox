
// Sound manager for background music and game effects
class SoundManager {
  private backgroundMusic: HTMLAudioElement | null = null;
  private winSound: HTMLAudioElement | null = null;
  private loseSound: HTMLAudioElement | null = null;
  private openingSound: HTMLAudioElement | null = null;
  private clickSound: HTMLAudioElement | null = null;

  constructor() {
    // Initialize background music (looping) - gaming ambient music
    this.backgroundMusic = new Audio('https://assets.mixkit.co/active_storage/sfx/2745/2745-preview.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.2;

    // Win sound effect
    this.winSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    this.winSound.volume = 0.5;

    // Lose sound effect
    this.loseSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
    this.loseSound.volume = 0.4;

    // Box opening sound
    this.openingSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    this.openingSound.volume = 0.5;

    // Click/button sound
    this.clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    this.clickSound.volume = 0.3;
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
      this.clickSound.currentTime = 0;
      this.clickSound.play().catch(err => console.log('Click sound error:', err));
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
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
