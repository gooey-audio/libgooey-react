export class Noise {
  private ctx: AudioContext;
  private gain: GainNode;
  private bufferSource: AudioBufferSourceNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.bufferSource = ctx.createBufferSource();
    this.bufferSource.buffer = buffer;

    this.gain = ctx.createGain();
    this.gain.gain.setValueAtTime(1, ctx.currentTime);

    this.bufferSource.connect(this.gain);
  }

  connect(gain: GainNode) {
    this.gain.connect(gain);
  }

  start() {
    this.bufferSource.start();
  }

  stop(future: number) {
    this.bufferSource.stop(future);
  }
}
