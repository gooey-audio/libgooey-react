

Libgooey is a typescript library which abstracts building blocks for audio generation (not samples playback). It can be used to create "instruments" which are a collection of oscillators composed with filters and envelopes which themselves can be sequenced together to form a drum machine-like playback system. Goals of this library are:

- Compatibility with but not coupling to the WebAudio api
- "Scheduled" changes, ie parameters can be altered according to the tempo, inspired by the [Acid Rain Maestro](https://acidraintechnology.com/products/maestro)
- Entropy, creating unique and mutant combinations 


Demo application at: https://libgooey-react.fly.dev/
