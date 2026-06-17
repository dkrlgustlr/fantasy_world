const SOUND_SETTINGS = {
  draw: {
    src: '/assets/sounds/card-draw.ogg',
    volume: 0.82,
    playbackRate: 1
  },
  discard: {
    src: '/assets/sounds/card-discard.ogg',
    volume: 0.96,
    playbackRate: 1.18
  }
};

export function createCardSoundEffects(options = {}) {
  const AudioClass = options.Audio ?? globalThis.window?.Audio;
  const AudioContextClass = options.AudioContext
    ?? globalThis.window?.AudioContext
    ?? globalThis.window?.webkitAudioContext;
  const sounds = new Map();
  let audioContext = null;

  function applyAudioSettings(audio, setting, overrides = {}) {
    audio.volume = overrides.volume ?? setting.volume;
    audio.playbackRate = overrides.playbackRate ?? setting.playbackRate;
  }

  function createAudio(setting) {
    if (!AudioClass) return null;
    const audio = new AudioClass(setting.src);
    if (typeof audio.canPlayType === 'function' && !audio.canPlayType('audio/ogg; codecs="vorbis"')) {
      return null;
    }
    audio.preload = 'auto';
    applyAudioSettings(audio, setting);
    audio.load?.();
    return audio;
  }

  function getAudio(kind) {
    const setting = SOUND_SETTINGS[kind];
    if (!setting) return null;
    if (!sounds.has(kind)) {
      sounds.set(kind, createAudio(setting));
    }
    return sounds.get(kind);
  }

  function unlock() {
    const hasAudioFiles = Boolean(getAudio('draw') && getAudio('discard'));
    const context = getAudioContext();
    context?.resume?.();
    return Boolean(hasAudioFiles || context);
  }

  function playDraw() {
    return playSound('draw');
  }

  function playDiscard() {
    return playSound('discard');
  }

  function playSound(kind, overrides = {}) {
    const setting = SOUND_SETTINGS[kind];
    const baseAudio = getAudio(kind);
    if (!setting) return false;
    if (!baseAudio) {
      return playSyntheticCardSound(kind, overrides);
    }

    const audio = typeof baseAudio.cloneNode === 'function'
      ? baseAudio.cloneNode(true)
      : baseAudio;

    applyAudioSettings(audio, setting, overrides);
    audio.currentTime = 0;
    const result = audio.play?.();
    result?.catch?.(() => {
      playSyntheticCardSound(kind, overrides);
    });
    return true;
  }

  function getAudioContext() {
    if (!AudioContextClass) return null;
    if (!audioContext) {
      audioContext = new AudioContextClass();
    }
    return audioContext;
  }

  function playSyntheticCardSound(kind, overrides = {}) {
    const context = getAudioContext();
    if (!context) return false;

    context.resume?.();
    const duration = kind === 'discard' ? 0.105 : 0.085;
    const sampleRate = context.sampleRate || 44100;
    const sampleCount = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = context.createBuffer?.(1, sampleCount, sampleRate);
    const source = context.createBufferSource?.();
    const gain = context.createGain?.();

    if (!buffer || !source || !gain) return false;

    const data = buffer.getChannelData(0);
    const intensity = overrides.volume ?? SOUND_SETTINGS[kind].volume;
    for (let i = 0; i < data.length; i += 1) {
      const progress = i / data.length;
      const decay = Math.pow(1 - progress, kind === 'discard' ? 2.2 : 1.45);
      data[i] = (Math.random() * 2 - 1) * decay * intensity;
    }

    source.buffer = buffer;
    gain.gain.setValueAtTime?.(kind === 'discard' ? 0.72 : 0.5, context.currentTime);
    gain.gain.exponentialRampToValueAtTime?.(0.001, context.currentTime + duration);

    const filter = context.createBiquadFilter?.();
    if (filter) {
      filter.type = kind === 'discard' ? 'lowpass' : 'highpass';
      filter.frequency.value = kind === 'discard' ? 2600 : 900;
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }

    gain.connect(context.destination);
    source.start(context.currentTime);
    source.stop?.(context.currentTime + duration);
    return true;
  }

  return {
    unlock,
    playDraw,
    playDiscard
  };
}
