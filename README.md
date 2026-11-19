# BREAK//LIMIT

A playable, dependency-free 2D fighting game. All art is drawn in Canvas; sound effects use Web Audio. No packages or build step are required. Google Fonts are optional; offline system fonts are provided.

## Play without Node.js

This is a static browser game. When served from GitHub Pages, open the site and play immediately; players do not need Node.js, npm, or a download. The repository includes a Pages workflow in `.github/workflows/pages.yml`.

For local development, Node.js is optional: `npm start` launches the small development server and `npm test` runs the regression checks. Those tools are only for development, not for playing the hosted game.

## Implemented

- Exploration levels now require defeating every enemy and reaching the glowing exit gate on the right. Boss victories finish their level immediately. Every level clear restores full health before the next stage loads. Distant targeted specials cannot transport the player across unexplored screens, and repeated transition calls cannot skip levels.
- Campaign creatures start at 80 HP with stronger chapter scaling, higher damage, and shorter cooldowns. Their wind-ups remain visible and dodgeable. Bosses act more frequently and start with more ultimate energy, while keeping normal character health and the challenger's phase.
- Fixed-length arm joints keep elbows, hands, and weapons connected, with relaxed idle arms and the rear arm behind the torso. Basic hits continue from the strike pose. Melee effects follow their strike direction, scripted crossovers turn toward the opponent, and dash streaks stop at movement range.
- A simple opening screen offers Singleplayer, 2 Player (Local), and Campaign. Each selection screen has a compact roster, large fighter artwork, and four form previews with real health and move descriptions. Switch between the two fighter slots to choose your rival or Player 2. Locked fighters can be inspected and tried in an awakened exhibition; their unlock link opens the appropriate campaign. Campaign separates the owned challenger from the route, and shows all nine stages, saved progress, and boss rewards. The layout adapts to laptop and narrow windows. Settings includes skill key bindings, sound, and reduced effects.
- Campaign gives each character nine levels: two scrolling exploration stages and one solo boss stage per chapter, for three bosses total. Groups grow from two to five enemies; enemies gain health, damage, and faster decisions as the campaign progresses. The first boss evolves the player to phase II; the second awakens them, and every new level starts at full health. Defeat retries the current level. Completed levels save as browser checkpoints. Tab cycles the current target; area attacks can hit multiple enemies.
- Campaign stages span several screens. The camera follows the player through sloping hills, low basins, and raised one-way platforms, with storm ruins, gravity tombs, or volcanic scenery. Jump through platforms from below and land on top; enemies can jump up after you. Creatures and bosses wait at their spawn positions until approached or struck, then remain engaged. Regular enemies retain overhead health bars. All opponents must be defeated to advance.
- Campaign opponents are a separate roster of twelve regular creatures, three types per theme. Each boss is a CPU-controlled version of the campaign character, matching the player’s phase and using normal character health and damage. Kairo’s route has lightning skitters, storm rays, and thunder monsters; Vex’s has void maws, seers, and abyss creatures; Nyra’s has scarabs, moths, and fire beasts. Early creatures only have interruptible basic attacks. Elites have one special ability, while bosses use the full playable character moveset. Regular health bars follow their heads; only bosses have health at the top of the screen.
- Kairo and Vex start unlocked. Choose any campaign, then enter with a fighter you already own. Clearing Nyra’s Expert campaign with Kairo or Vex unlocks Nyra, the Sunforged, for all modes. Rewards and checkpoints belong to the chosen campaign, independently of the fighter you use. Nyra has faster movement, stronger damage, four distinct form movesets: ember fists and a single falling meteor; spinning kicks and orbiting meteors; ranged sunbolts, solar prisms and a focused lance; then phoenix claws, protective wings and Worldfall’s meteor storm. Her campaign is Expert difficulty; Ronin’s is Master. Campaign unlocks and checkpoints are saved locally in this browser, not in an online account.

- Each phase has distinct casting poses and attack shapes, also retained in defensive clashes. Kairo progresses from a single thunderbolt to twin helix blades, floating sword rain, and a full storm. Vex progresses from gravity slabs to orbiting twin wells, crushing cages, and singularities. Their quick chains and shields also change shape with each phase; awakened Nyra finishes Worldfall with a miniature sun.
- Ronin, the Oathblade: a sword specialist with a fast three-cut chain, a blade guard, armored rising cleaves, and an aerial execution. Evolutions introduce twin blades, summoned sword formations, and a colossal awakened greatsword. Each ultimate hit deals damage; ordinary cuts remain interruptible. The Broken Oath is his nine-stage Master campaign, with blade mites, razor wraiths, iron sentinels, and three Ronin bosses. Clear it with an owned fighter to unlock him. Select Ronin and choose **Try Ronin · Awakened** to try him immediately in an exhibition without changing progression.
- Graphics include shaded clothing and faces, metallic armor and swords, layered weapon trails, lantern glow, distant towers and forest silhouettes, moving foliage, cloud haze, and textured platform edges. Atmospheric backgrounds are cached between updates while fighters and attacks render every frame.
- Kairo: homing Flash Cut, a lightning shield that repels attackers, an armored Thunderfall, and Storm Severance in form I: a short rising draw and plunge. Form II gains Tempest Execution: a longer aerial assault with two cross-cuts, a giant lightning blade, and three thunder pillars. Flash Cut and awakened Godflash now chain three quick, interruptible presses into a knockdown finisher; Thunder God rises into the sky; Heaven’s Judgement imprisons the target before a divine spear impact.
- Vex: Gravity Grasp chains quick gravity punches into a launcher, Void Bastion stores absorbed damage for a burst, Crush lifts and slams, and Void Collapse detonates a gravity well. Awakened Event Horizon adds extra hits to its fast punch chain, Zero restrains and flings the target skyward before a ground slam, and End of Everything compresses its victim in a singularity before a supernova.
- Solo AI or two players on the same keyboard; character selection, rematches, pause, controls, optional synthesized sound, and reduced effects. Matches fill the browser window, with an optional native full-screen button. Player 1 skills sit at bottom left and Player 2 skills at bottom right, both showing live cooldowns and ultimate energy. The CPU panel is read-only in solo play.
- First to three. Winner recovers 40% of missing health; loser evolves and fully heals. An opponent at two points immediately forces awakening and its full heal. At 2–2 both awaken and the Fractured Heavens replaces the temple.
- Evolution scales damage, movement, effects, selected follow-up attacks, and maximum health: **200 / 260 / 320 / 400 HP** at tiers I / II / III / IV. Each upgrade fully heals to the new maximum; winner recovery still uses 40% of missing health at their current maximum. Awakened fighters have altered appearances, halos/singularities, stronger abilities, and shorter skill cooldowns.
- Ultimate energy from combat, directional guard, perfect guard, distinct shields, dash invulnerability, hit stop, particles, ground cracks, attack telegraphs, and camera shake. The old second ability and both counters have been removed.
- Kairo dash skills detect contact continuously along their path, stop at the opponent, and confirm into their follow-up attacks. Storm Severance uses contact detection to confirm into its airborne execution. Every skill faces the enemy automatically; Kairo attack dashes track moving and airborne targets within their range.
- Direct-contact shield impacts freeze both fighters and their move timelines, then show a slow-motion struggle between the attack and shield. An equal or stronger shield flings the attacker across the arena with reduced air drag. A higher-form attacker overwhelms the shield: it cracks, breaks, and knocks the defender to the ground without damage from the blocked attack. Armored slams finish before a pending shield reaction or losing-attacker recoil resolves.
- Articulated animations drive sword strikes, punches, running, jumping, directional lunges, shields, recoil, sky ascents, ground slams, and cinematic finishers. Knockback, stun, restraint, tumbling, and grounded knockdown affect controls. Captured targets cannot act until released; armor resists capture and displacement.
- Thunderfall, Crush, their evolved/awakened forms, and ultimates are armored throughout charging and animation. They still take damage and can be KO’d, but ordinary hits do not interrupt, stun, or knock them back. A deliberate overhead barrier clash can stop them. The HUD labels this state “UNSTOPPABLE.”
- The first skill has a **0.35-second cooldown**, **0.1-second recovery**, and a three-press combo; other skills have **0.4 seconds of recovery after their animation**. Movement dashes can resume after the animation. The first skill serves as the basic combo attack; there is no separate basic-attack button. Movement dashes now last 0.28 seconds at tier-scaled speeds of 1400 / 1600 / 1800 / 2200 units per second, with evolving lightning or gravity trails. Awakened Kairo becomes a lightning bolt; awakened Vex becomes a void rift. The movement dash follows the last movement direction; attack skills automatically aim at the opponent.
- A dual-awakening exhibition starts at 2–2 with full energy so the final arena and ultimates can be tried immediately.

- Remote attacks are absorbed by shields without recoiling their caster. Lightning strikes and gravity fields deal damage even when armor prevents restraint. Later slams and ultimates form defensive overhead barriers against an earlier airborne cast. Equal or stronger barriers stop the attack with no retaliation, and the attacker backflips to its casting origin. Higher-phase attacks slowly break through for 40% of their normal tier-scaled damage. Clashes animate repeated overhead strikes, bracing, recoil, barrier compression, impact ripples, a final defensive shove, and a distinct buckling sequence when overpowered. Stunned, downed, and restrained fighters can receive new knockback; armored moves retain their displacement immunity.
- Special clashes retain both selected move identities and casting clips. Meteors fall toward the defender; Thunder God fires lightning to explode them, gravity catches and compresses them, singularities swallow them, and solar attacks use beams, pillars, wings or opposing meteors. Higher-phase attacks still break through at 40% damage. Kairo’s ultimate resists stun, knockback, launch and restraint through its ending animation, while still taking damage.
- Settings lets both players rebind the three skills and ultimate, saves choices in this browser, prevents conflicting keys, and offers a default reset. Matches pause during editing.

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
| Campaign target | Tab | — |

## Design notes / scope

Defended specials retain their movement and impact sequence. Kairo's early ultimates share the same launch, aerial cross-slash, and landing paths in ordinary hits and defended combos; shields or opposing specials counter each beat while being carried through the attack. Impact pauses, animated bracing, trails, and expanding shockwaves emphasize each collision. Shielded combos deal no damage; higher-phase specials still break through opposing specials at 40% power. Reduced FX keeps camera shake off and softens flashes and trails.

This is the first playable slice, using stylized procedural 2D art. Cinematics are in-arena effects rather than the full bespoke cinematic sequences described in the concept. Online multiplayer, gamepads, touch controls, 3D models, destructible geometry, and music are not implemented. Local play can be affected by keyboard key rollover limits.

In Singleplayer and Local, the selected first-to-three rules mean a fighter normally progresses **I → II → IV**: on their second loss, the opponent is at match point, which forces awakening. Tier III scaling and rendering are included but this intermediate tier is skipped in regular matches to honor the immediate awakening rule. The interface does not invent an extra round to expose it.

Singleplayer and Local rounds have a 90-second timeout. Campaign levels have no time limit. Highest remaining HP wins; tied HP adds 15 seconds. Health is carried over, cooldowns reset between rounds, and each fighter receives 15 ultimate energy between rounds. An already-awakened loser still fully heals for the next round. These are prototype tuning decisions.

## Files

- `src/engine.js`: combat, AI, match rules; independent of browser APIs.
- `src/enemies.js`: independent campaign creature definitions and attack timelines.
- `src/locomotion.js`: crowd spacing, jump physics, and travel-driven creature animation.
- `src/ronin-moves.js`: sword combo, guard, special, and ultimate timelines.
- `src/steel-art.js`: articulated Ronin, metallic blades, and shared attack/defense sword visuals.
- `src/atmosphere.js`: materials, lighting, foliage, and distant scenery.
- `src/terrain.js`: campaign world layouts, slopes, and platform collision surfaces.
- `src/campaign-scene.js`: scrolling themed landscapes and parallax scenery.
- `src/forms.js`: Kairo and Vex phase-specific names, hints, and animation choices.
- `src/campaign-ui.js`: boss-only health display.
- `src/campaign.js`: multi-enemy battles, campaign stages, boss upgrades, checkpoints, and unlocks.
- `src/specials.js`: form-specific move identities and special-clash interactions.
- `src/choreography.js`: shared combo body paths and timed clash movement.
- `src/cast-playback.js`: samples real skill casts for clashes, retaining their joint animations and attack effects while redirecting trajectories to the collision point.
- `src/moves.js`: skill timelines, scripted movement, restraints, shields, and finishers.
- `src/render.js`: arena, character drawing, effects.
- `src/power-vfx.js`: shared directional attack and defense artwork, including sustained lightning barrages, sculpted spears, burning meteors, phoenixes, and gravity fields.
- `src/animation.js`: interpolated body and joint keyframes.
- `src/rig.js`: shared arm joints and wrist reach limits.
- `src/visual-direction.js`: world-to-local attack effect trajectories.
- `tests/graphics-regressions.test.mjs`: arm geometry, hit poses, facing, and attack direction checks.
- `tests/graphics-review.html` and `tests/campaign-flow-review.html`: visual checks for poses, mirrored attacks, exit gates, and healing.
- `src/main.js`: UI and controls.
- `src/selection.js` and `selection.css`: roster, form previews, duel player choices, and campaign selection.
- `tests/selection.test.mjs`: selection locks, campaign challenger independence, and form move data.
- `src/audio.js`: synthesized effects.
- `tests/combat.test.mjs`: gameplay regression checks, including every slam evolution and every skill timeline.
- `tests/campaign.test.mjs`: full progression, multiple enemies, saved unlocks, and every Nyra ability.
- `tests/locomotion.test.mjs`: crowd collisions, jump dodges, air dashes, hit-confirmed cancels, and input buffering.
- `tests/terrain.test.mjs`: scrolling bounds, platform physics, enemy activation, and combat beyond the first screen.
- `tests/scrolling-review.html`: inspect traversal, platforms, sleeping enemies, and each landscape theme.
- `tests/phase-review.html`: compare attack and defensive phase identities side by side.
- `tests/campaign-review.html`: visual group fight and boss review.
- `tests/movement-review.html`: step through crowd movement, a jump dodge, and a skill → jump → air dash → skill sequence.
- `tests/clash-review.html`: step through impacts or play defended combos and special clashes.
- `tests/startup-review.html`: browser checks for Singleplayer, Local, Campaign, switching modes, and awakening preview. Open it through the local server and click Run startup checks; it uses the real interface with a controlled animation clock.
- `tests/animation-review.html`: visual pose and animation review using the game renderer.


