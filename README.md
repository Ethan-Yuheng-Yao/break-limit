# BREAK//LIMIT

A playable, dependency-free 2D fighting game. All art is drawn in Canvas; sound effects use Web Audio. No packages or build step are required. Google Fonts are optional; offline system fonts are provided.

## Run

Install Node.js, then run `npm start` in this directory. Open http://127.0.0.1:4173. Run `npm test` for the combat and progression checks.

## Implemented

- Kairo: homing Flash Cut, a lightning shield that repels attackers, an armored Thunderfall, and Storm Severance in form I: a short rising draw and plunge. Form II gains Tempest Execution: a longer aerial assault with two cross-cuts, a giant lightning blade, and three thunder pillars. Awakened Godflash performs five attacks from different directions and finishes downward; Thunder God rises into the sky; Heaven’s Judgement imprisons the target before a divine spear impact.
- Vex: Gravity Grasp drags and throws enemies, Void Bastion stores absorbed damage for a burst, Crush lifts and slams, and Void Collapse detonates a gravity well. Awakened Event Horizon ejects its victim from a black hole, Zero restrains and flings the target skyward before a ground slam, and End of Everything compresses its victim in a singularity before a supernova.
- Solo AI or two players on the same keyboard; character selection, rematches, pause, controls, optional synthesized sound, and reduced effects. Matches fill the browser window, with an optional native full-screen button. Player 1 skills sit at bottom left and Player 2 skills at bottom right, both showing live cooldowns and ultimate energy. The CPU panel is read-only in solo play.
- First to three. Winner recovers 40% of missing health; loser evolves and fully heals. An opponent at two points immediately forces awakening and its full heal. At 2–2 both awaken and the Fractured Heavens replaces the temple.
- Evolution scales damage, movement, effects, selected follow-up attacks, and maximum health: **200 / 260 / 320 / 400 HP** at tiers I / II / III / IV. Each upgrade fully heals to the new maximum; winner recovery still uses 40% of missing health at their current maximum. Awakened fighters have altered appearances, halos/singularities, stronger abilities, and shorter skill cooldowns.
- Ultimate energy from combat, directional guard, perfect guard, distinct shields, dash invulnerability, hit stop, particles, ground cracks, attack telegraphs, and camera shake. The old second ability and both counters have been removed.
- Kairo dash skills detect contact continuously along their path, stop at the opponent, and confirm into their follow-up attacks. Storm Severance uses contact detection to confirm into its airborne execution. Every skill faces the enemy automatically; Kairo attack dashes track moving and airborne targets within their range.
- Shield impacts freeze both fighters and their move timelines, then show a slow-motion struggle between the attack and shield. An equal or stronger shield flings the attacker across the arena with reduced air drag. A higher-form attacker overwhelms the shield: it cracks, breaks, and knocks the defender to the ground without damage from the blocked attack. Armored slams finish before a pending shield reaction or losing-attacker recoil resolves.
- Articulated animations drive sword strikes, punches, running, jumping, directional lunges, shields, recoil, sky ascents, ground slams, and cinematic finishers. Knockback, stun, restraint, tumbling, and grounded knockdown affect controls. Captured targets cannot act until released; armor resists capture and displacement.
- Thunderfall, Crush, their evolved/awakened forms, and ultimates are armored throughout charging and animation. They still take damage and can be KO’d, but hits do not interrupt, stun, or knock them back. The HUD labels this state “UNSTOPPABLE.”
- Each skill has **0.4 seconds of recovery after its animation** before another skill is allowed. Movement dashes can resume after the animation. Basic attacks and manual combos have been removed; combat uses skills, ultimates, and guard. The movement dash follows the last movement direction; attack skills automatically aim at the opponent.
- A dual-awakening exhibition starts at 2–2 with full energy so the final arena and ultimates can be tried immediately.

## Controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | A / D | Left / Right |
| Jump | W / Space | Up |
| Dash | Q | U |
| Attack / shield / slam | 1 / 2 / 3 | 8 / 9 / 0 |
| Guard | Hold F | Hold K |
| Ultimate | ~ (backtick key) | - |
| Pause | Esc | Esc |

## Design notes / scope

This is the first playable slice, using stylized procedural 2D art. Cinematics are in-arena effects rather than the full bespoke cinematic sequences described in the concept. Online multiplayer, gamepads, touch controls, 3D models, destructible geometry, and music are not implemented. Local play can be affected by keyboard key rollover limits.

The selected first-to-three rules mean a fighter normally progresses **I → II → IV**: on their second loss, the opponent is at match point, which forces awakening. Tier III scaling and rendering are included but this intermediate tier is skipped in regular matches to honor the immediate awakening rule. The interface does not invent an extra round to expose it.

Rounds have a 90-second timeout. Highest remaining HP wins; tied HP adds 15 seconds. Health is carried over, cooldowns reset between rounds, and each fighter receives 15 ultimate energy between rounds. An already-awakened loser still fully heals for the next round. These are prototype tuning decisions.

## Files

- `src/engine.js`: combat, AI, match rules; independent of browser APIs.
- `src/moves.js`: skill timelines, scripted movement, restraints, shields, and finishers.
- `src/render.js`: arena, character drawing, effects.
- `src/animation.js`: interpolated body and joint keyframes.
- `src/main.js`: UI and controls.
- `src/audio.js`: synthesized effects.
- `tests/combat.test.mjs`: gameplay regression checks, including every slam evolution and every skill timeline.
- `tests/animation-review.html`: visual pose and animation review using the game renderer.


