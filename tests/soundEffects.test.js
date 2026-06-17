import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createCardSoundEffects } from '../public/soundEffects.js';

class FakeAudio {
  static instances = [];

  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.volume = 1;
    this.playbackRate = 1;
    this.preload = '';
    this.plays = 0;
    FakeAudio.instances.push(this);
  }

  load() {
    this.loaded = true;
  }

  play() {
    this.plays += 1;
    return Promise.resolve();
  }
}

class FakeUnsupportedOggAudio extends FakeAudio {
  canPlayType(type) {
    return type.includes('ogg') ? '' : 'probably';
  }
}

class FakeRejectingAudio extends FakeAudio {
  canPlayType() {
    return 'probably';
  }

  play() {
    this.plays += 1;
    return Promise.reject(new Error('blocked'));
  }
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
    this.resumes = 0;
    this.started = 0;
  }

  resume() {
    this.resumes += 1;
    return Promise.resolve();
  }

  createBuffer() {
    return {
      getChannelData: () => new Float32Array(128)
    };
  }

  createBufferSource() {
    return {
      connect: () => {},
      start: () => {
        this.started += 1;
      },
      stop: () => {}
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {}
    };
  }

  createBiquadFilter() {
    return {
      type: '',
      frequency: { value: 0 },
      connect: () => {}
    };
  }
}

test('card audio files and license exist', () => {
  assert.equal(existsSync('public/assets/sounds/card-draw.ogg'), true);
  assert.equal(existsSync('public/assets/sounds/card-discard.ogg'), true);
  assert.equal(existsSync('public/assets/sounds/LICENSE-Kenney-Casino-Audio.txt'), true);
});

test('card sound effects use real Kenney card audio files at louder volume', () => {
  FakeAudio.instances = [];
  const sounds = createCardSoundEffects({ Audio: FakeAudio });

  assert.equal(sounds.unlock(), true);
  sounds.playDraw();
  sounds.playDiscard();

  assert.equal(FakeAudio.instances.length, 2);
  assert.ok(FakeAudio.instances.some((audio) => audio.src.endsWith('/assets/sounds/card-draw.ogg')));
  assert.ok(FakeAudio.instances.some((audio) => audio.src.endsWith('/assets/sounds/card-discard.ogg')));
  assert.ok(FakeAudio.instances.every((audio) => audio.volume >= 0.7));
  assert.ok(FakeAudio.instances.every((audio) => audio.plays >= 1));
});

test('discard sound plays only one table hit sound', () => {
  FakeAudio.instances = [];
  const sounds = createCardSoundEffects({
    Audio: FakeAudio,
    setTimeout: () => {
      assert.fail('discard should not schedule a second sound');
      return 1;
    }
  });

  sounds.playDiscard();

  const hit = FakeAudio.instances.find((audio) => audio.src.endsWith('/assets/sounds/card-discard.ogg'));

  assert.equal(FakeAudio.instances.length, 1);
  assert.ok(hit);
  assert.equal(hit.plays, 1);
  assert.ok(hit.volume >= 0.9);
});

test('card sound effects are safe when HTMLAudioElement is unavailable', () => {
  const sounds = createCardSoundEffects({ Audio: null });

  assert.equal(sounds.unlock(), false);
  assert.doesNotThrow(() => sounds.playDraw());
  assert.doesNotThrow(() => sounds.playDiscard());
});

test('card sound effects fall back to Web Audio when OGG is unsupported', () => {
  const contexts = [];
  const sounds = createCardSoundEffects({
    Audio: FakeUnsupportedOggAudio,
    AudioContext: class extends FakeAudioContext {
      constructor() {
        super();
        contexts.push(this);
      }
    }
  });

  assert.equal(sounds.unlock(), true);
  assert.equal(sounds.playDraw(), true);
  assert.equal(sounds.playDiscard(), true);
  assert.equal(contexts.length, 1);
  assert.ok(contexts[0].resumes >= 1);
  assert.equal(contexts[0].started, 2);
});

test('card sound effects fall back to Web Audio when audio playback is blocked', async () => {
  const contexts = [];
  const sounds = createCardSoundEffects({
    Audio: FakeRejectingAudio,
    AudioContext: class extends FakeAudioContext {
      constructor() {
        super();
        contexts.push(this);
      }
    }
  });

  sounds.unlock();
  assert.equal(sounds.playDraw(), true);
  await Promise.resolve();

  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].started, 1);
});

test('app wires card sounds to draw and discard actions', () => {
  const app = readFileSync('public/app.js', 'utf8');

  assert.match(app, /from '\.\/soundEffects\.js'/);
  assert.match(app, /createCardSoundEffects\(\)/);
  assert.match(app, /playActionSound\(action\)/);
  assert.match(app, /case 'draw-deck'/);
  assert.match(app, /case 'draw-discard'/);
  assert.match(app, /case 'discard'/);
});

test('app plays card sounds before waiting for the server action response', () => {
  const app = readFileSync('public/app.js', 'utf8');
  const postActionBody = app.match(/async function postAction\(action, body = \{\}\) \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.ok(postActionBody.indexOf('playActionSound(action)') !== -1);
  assert.ok(postActionBody.indexOf('await request') !== -1);
  assert.ok(
    postActionBody.indexOf('playActionSound(action)') < postActionBody.indexOf('await request'),
    'sound should play immediately on action input, before network latency'
  );
});
