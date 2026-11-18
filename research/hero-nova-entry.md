# Hero entrance matched to the visual reference

Reference observed directly on 2026-11-17: https://nova-dental-dev.webflow.io/

Live DOM observations after reload showed the background at approximately scale 1.1, settling toward 1.0. Title lines began below their masks at translateY(110%) and opacity 0, then entered in sequence. Supporting text appeared later with a roughly 20px upward movement and fade; the appointment button followed. No reference assets or scripts were copied.

The Fine Dentistry implementation uses an original CSS animation with a 2000ms photograph scale from 1.1 to 1, masked title lines starting at 600ms with 110ms staggering, followed by the supporting text at 1100ms, appointment button at 1220ms, and scroll link at 1360ms. The previous animation on the entire title-and-CTA container was removed so each part enters independently. The timing is visually matched from observed states, not asserted to be the reference's exact source-code timing.

The approved team photograph, lower-left title, right-aligned supporting information, hero covering scroll effect and page transition remain in place. Photo overscan is clipped inside a separate image wrapper so the zoom cannot bleed into adjacent sections. Reduced-motion settings show all content immediately. Keyboard focus also immediately reveals the supporting controls.

Verification: production build, lint, and `tests/entry-motion.cjs` passed at 390px and 1440px, including photograph settling, line visibility, CTA ordering, scroll reveals and reduced motion. Preview: `videos/hero-nova-entry-preview.webm`.
