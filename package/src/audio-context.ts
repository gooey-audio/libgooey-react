export const isSupported = () =>
  typeof window !== "undefined" &&
  ("AudioContext" in window || "webkitAudioContext" in window);

let globalAudioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!isSupported()) {
    throw new Error("AudioContext is not supported in this environment");
  }

  if (!globalAudioContext || globalAudioContext.state === "closed") {
    globalAudioContext = new AudioContext();
  }

  return globalAudioContext;
};
