// Core audio classes
export { Oscillator, OscType } from "./oscillator";
export { Noise } from "./noise";
export { Envelope, type ADSRConfig } from "./envelope";
export { Filter, type FilterConfig } from "./filter";

// Instrument and composition
export { Instrument } from "./instrument";
export { makeKick, type KickConfig } from "./kick";
export { makeSnare, type SnareConfig } from "./snare";

// Audio context and stage management
export { getAudioContext } from "./audio-context";
export { Stage } from "./stage";

// Sequencing
export { Sequencer } from "./sequencer";

// React hooks
export {
  useLibGooey,
  type UseLibGooeyOptions,
  type UseLibGooeyReturn,
} from "./libgooey";

// Utility hooks
export { useBeatTracker } from "./hooks/useBeatTracker";
