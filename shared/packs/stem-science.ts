import type { ContentPack } from './types'
import type { CurriculumTrack } from '../lessons'

const PHYS_TRACK: CurriculumTrack = {
  id: 'track-astrophysics-orbital-mechanics',
  slug: 'astrophysics-orbital-mechanics',
  packId: 'astrophysics-orbital-mechanics',
  title: 'Physics: Mechanics, EM Fields & Optics',
  category: 'Science',
  subject: 'Physics',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: ['track-algebra-linear-systems'],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'phys-u1',
      title: 'Forces, Orbits, DC/RC Circuits & Wave-Particle Fields',
      anchoringPhenomenon:
        'A single inverse-square or Lorentz force vector governs both planetary slingshots around stars and helical electron trajectories inside magnetic traps.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'phys-u1-l1',
          unitId: 'phys-u1',
          title: 'Keplerian Orbits & Angular Momentum Conservation',
          summary:
            'Explore why orbital eccentricity drives speed variations between perihelion and aphelion with constant areal velocity.',
          estimatedMinutes: 9,
          standards: ['NGSS HS-ESS1-4', 'AP Physics 1 Unit 3'],
          prerequisiteLessonIds: [],
          visual: {
            kind: 'model-3d',
            modelId: 'kepler',
            initialParams: { e: 0.45, a: 3.5, sectors: true },
            highlightHotspots: ['sun', 'perihelion', 'aphelion', 'sectors'],
          },
          steps: [
            {
              id: 'phys-u1-l1-s1',
              kind: 'narrative',
              title: 'Why Elliptical Orbits Speed Up Near Stars',
              bodyMarkdown:
                'Gravity pulls a planet straight toward the focal star—applying **zero external torque** around the focus. Because angular momentum $L = m r v_\\perp$ stays strictly conserved, cutting orbital distance $r$ in half at **perihelion** doubles transverse speed $v_\\perp$ compared to wide **aphelion**.',
              callout: {
                tone: 'key-idea',
                text: 'Equal areas swept in equal times (Kepler II) is pure geometric proof of angular momentum conservation dL/dt = 0.',
              },
            },
            {
              id: 'phys-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Increase Eccentricity in 3D Kepler Lab',
              predictionPrompt:
                'When eccentricity e increases from 0.10 to 0.70 at fixed semi-major axis a, what happens to the planet’s speed as it swings past perihelion?',
              predictionChoices: [
                'Speed stays constant around the whole ellipse',
                'Perihelion speed spikes sharply while equal-time sectors stretch skinny near focus and wide near aphelion',
                'Orbital period T³ doubles immediately',
                'Gravity turns repulsive near aphelion',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'kepler',
                initialParams: { e: 0.65, a: 3.5, vectors: true, sectors: true },
                highlightHotspots: ['perihelion', 'aphelion', 'sectors'],
              },
              observeInstruction:
                'Toggle velocity vectors and equal-area sectors in the 3D Kepler viewer while raising eccentricity e toward 0.7.',
              explainPrompt: 'Why do both shaded sectors retain the exact same area despite different radial lengths?',
              explainOptions: [
                'Wider arc at small r balances skinny narrow arc at large r because dA/dt = L / (2m) is constant',
                'Because kinetic energy never changes',
                'Because sun mass changes every half-orbit',
                'Because orbital velocity reverses direction',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Since gravitational force is purely central, L stays constant and areal sweep rate L/(2m) remains invariant around every point of the ellipse.',
            },
            {
              id: 'phys-u1-l1-s3',
              kind: 'worked-example',
              title: 'Resolving Normal Force vs Friction on an Incline',
              problemMarkdown:
                'A **12 kg** crate sits on a **$30^\\circ$** ramp with friction coefficient $\\mu = 0.20$. Compute the normal force $F_N$.',
              steps: [
                {
                  label: 'Decompose gravity parallel and perpendicular to the slope',
                  expressionOrAction: 'mg = 12 × 9.8 = 117.6 N;  F_g⊥ = mg cos(30°)',
                  whyNote: 'Normal force balances ONLY the perpendicular component pressing into the ramp, not full weight mg!',
                },
                {
                  label: 'Calculate F_N cleanly',
                  expressionOrAction: 'F_N = 117.6 × 0.8660 ≈ 101.8 N.',
                  whyNote: 'On steeper slopes, cos(θ) drops and normal support force shrinks.',
                },
              ],
            },
            {
              id: 'phys-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Dynamic Inclined-Plane Normal Force',
              question: {
                type: 'figure',
                prompt: 'Find the normal force F_N (in N) supporting the block on the inclined plane (round to tenths).',
                figure: {
                  template: 'inclined-plane',
                  givens: { mass: 10, angle: 30, mu: 0.2 },
                  ask: 'normalForce',
                  rounding: 'tenth',
                  ranges: { mass: [5, 25], angle: [15, 50], mu: [0.1, 0.35] },
                },
                explanation: 'Normal force perpendicular to an incline of angle θ is F_N = m · 9.8 · cos(θ).',
                points: 15,
              },
            },
            {
              id: 'phys-u1-l1-s5',
              kind: 'synthesis',
              title: 'Central Forces & Ramps Unified',
              takeaways: [
                'Tilted coordinates align x parallel to the ramp (mg sin θ) and y perpendicular (F_N = mg cos θ).',
                'Zero central torque locks L = mrv⊥ constant, forcing Kepler speed surges at perihelion.',
              ],
              nextQuizIndex: 0,
              arcadeLaunch: { mode: 'sim-sandbox', packId: 'astrophysics-orbital-mechanics' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'phys-u1-l1-fc1',
              front: 'Components of gravitational weight mg on a ramp tilted by θ from horizontal',
              back: 'Downslope: mg sin θ; Perpendicular (balanced by F_N): mg cos θ.',
              explanation: 'Sanity check at θ = 0°: sin 0° = 0 (flat), cos 0° = 1 (F_N = mg).',
              interleave: true,
            },
            {
              id: 'phys-u1-l1-fc2',
              front: 'Why does Kepler’s Second Law (equal areas in equal times) hold for any central force?',
              back: 'Central force applies zero torque τ = r × F = 0, so angular momentum L stays conserved and dA/dt = L/(2m) is constant.',
              explanation: 'Works for inverse-square gravity and any purely radial attraction.',
              interleave: true,
            },
            {
              id: 'phys-u1-l1-fc3',
              front: 'Inverse-square gravity scaling if separation r triples',
              back: 'Force drops to 1/9 of its original value (F ∝ 1/r²).',
              explanation: 'Gravitational flux spreads uniformly across spherical shell area 4πr².',
              interleave: true,
            },
          ],
        },
        {
          id: 'phys-u1-l2',
          unitId: 'phys-u1',
          title: 'Series-Parallel DC Networks & RC Charging Curves',
          summary:
            'Combine series current sharing and parallel voltage equality with exponential capacitor time constant τ = RC.',
          estimatedMinutes: 9,
          standards: ['AP Physics 2 Unit 4', 'NGSS HS-PS3-5'],
          prerequisiteLessonIds: ['phys-u1-l1'],
          visual: { kind: 'model-2d', modelId: 'dc-rc-circuits-2d' },
          steps: [
            {
              id: 'phys-u1-l2-s1',
              kind: 'narrative',
              title: 'How Nodes Dictate Voltage vs Current Division',
              bodyMarkdown:
                'Resistors in **series** share the exact same **current** (one path, resistances add: $R_1 + R_{23}$). Resistors in **parallel** share identical **voltage** across their junction nodes (two paths, conductances add: $1/R_{23} = 1/R_2 + 1/R_3$).\n\nInsert a capacitor $C$ in series and voltage climbs asymptotically toward $V_{\\text{bat}}$ with **time constant $\\tau = RC$**—reaching ~63.2% of final charge after $1\\tau$.',
              callout: {
                tone: 'key-idea',
                text: 'Always collapse the innermost parallel pair R₂ || R₃ = (R₂R₃)/(R₂+R₃) FIRST before adding series R₁.',
              },
            },
            {
              id: 'phys-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Predict Adding a Parallel Branch & Scaling τ = RC',
              predictionPrompt:
                'Suppose you connect another resistor IN PARALLEL across a circuit branch already wired to a battery. What happens to total equivalent resistance R_eq and battery current I_tot?',
              predictionChoices: [
                'R_eq goes UP and total current drops',
                'R_eq goes DOWN (opening another parallel lane lowers bottleneck) and total battery current goes UP',
                'Both stay unchanged',
                'Battery voltage doubles',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'dc-rc-circuits-2d' },
              observeInstruction:
                'Adjust R and C parameters in the interactive 2D DC/RC Circuit simulator and track current decay alongside capacitor voltage vs time.',
              explainPrompt: 'After t = 1τ = RC seconds of charging from 0 V, what fraction of battery voltage sits across the capacitor?',
              explainOptions: [
                '1 − e⁻¹ ≈ 63.2% of V_bat',
                'Exactly 50%',
                '100% instantly',
                '36.8% (e⁻¹)',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Charging follows V_C(t) = V_bat(1 − e^(−t/RC)), hitting 63.2% at 1τ, 86.5% at 2τ, and >99% by 5τ.',
            },
            {
              id: 'phys-u1-l2-s3',
              kind: 'branching-scenario',
              title: 'Diagnose a Series-Parallel Branch Current Bug',
              startNodeId: 'circuit-bug',
              nodes: {
                'circuit-bug': {
                  promptMarkdown:
                    'A 24 V battery feeds series $R_1 = 4\\,\\Omega$ into parallel branches $R_2 = 6\\,\\Omega$ and $R_3 = 12\\,\\Omega$. A student tries $I_2 = 24\\text{ V} / 6\\,\\Omega = 4\\text{ A}$. Why is $4\\text{ A}$ wrong?',
                  choices: [
                    {
                      label: 'R₁ drops 3 A × 4 Ω = 12 V FIRST, leaving only 12 V across the parallel node (so I₂ = 12/6 = 2 A)',
                      nextNodeId: 'power-check',
                      feedback: 'Spot on! Only branches connected directly across the battery rails see full 24 V; series R₁ steals half the voltage.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Because R₂ and R₃ add in series to 18 Ω',
                      nextNodeId: 'circuit-bug',
                      feedback: 'R₂ and R₃ share the same parallel node pair, so they combine as (6×12)/(6+12) = 4 Ω, giving R_eq = 8 Ω and I_tot = 3 A.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
                'power-check': {
                  promptMarkdown: 'Now check conservation of current at the node: if I_tot = 3 A and I₂ = 2 A, what is I₃?',
                  choices: [
                    {
                      label: '1 A (and indeed 12 V / 12 Ω = 1 A!)',
                      nextNodeId: null,
                      feedback: 'Verified via both Kirchhoff Current Law (3 − 2 = 1 A) and Ohm’s Law!',
                      outcome: 'optimal',
                    },
                    {
                      label: '3 A',
                      nextNodeId: null,
                      feedback: 'Current splits across parallel lanes: I_tot = I₂ + I₃.',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'phys-u1-l2-s4',
              kind: 'checkpoint',
              title: 'Dynamic Series-Parallel Resistance',
              question: {
                type: 'figure',
                prompt: 'Compute the total equivalent resistance R_eq (in Ω) of the labeled circuit (round to tenths).',
                figure: {
                  template: 'series-parallel-circuit',
                  givens: { voltage: 24, r1: 4, r2: 6, r3: 12 },
                  ask: 'equivR',
                  rounding: 'tenth',
                  ranges: { voltage: [12, 48], r1: [2, 10], r2: [4, 24], r3: [4, 24] },
                },
                explanation: 'Combine parallel R₂ || R₃ = (R₂·R₃)/(R₂ + R₃), then add series R₁.',
                points: 15,
              },
            },
            {
              id: 'phys-u1-l2-s5',
              kind: 'synthesis',
              title: 'Circuit Solving Workflow',
              takeaways: [
                'Reduce parallel blocks (product/sum), sum series stages, solve I_tot = V / R_eq, then step back for branch voltages.',
                'In RC circuits, time constant τ = RC sets charging/discharging speed exponentially.',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'step-detective', packId: 'astrophysics-orbital-mechanics' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'phys-u1-l2-fc1',
              front: 'Kirchhoff Loop Rule (KVL) and Junction Rule (KCL) conservation laws',
              back: 'KVL: sum of voltage drops around any closed loop = 0 (Energy). KCL: sum of currents into any node = sum leaving (Charge).',
              explanation: 'Every DC circuit equation follows from energy and charge conservation.',
              interleave: true,
            },
            {
              id: 'phys-u1-l2-fc2',
              front: 'Physical meaning of RC time constant τ = R·C',
              back: 'Time required for a charging capacitor to reach 63.2% (1 − 1/e) of source voltage, or discharge to 36.8% (1/e).',
              explanation: 'Units check: (V/A)·(C/V) = C / (C/s) = seconds!',
              interleave: true,
            },
            {
              id: 'phys-u1-l2-fc3',
              front: 'Two-resistor parallel shortcut formula',
              back: 'R_parallel = (R₂ · R₃) / (R₂ + R₃), which is always strictly smaller than the smaller resistor.',
              explanation: 'Equivalently 1/R_p = 1/R₂ + 1/R₃.',
              interleave: true,
            },
          ],
        },
        {
          id: 'phys-u1-l3',
          unitId: 'phys-u1',
          title: 'Lorentz Cyclotron Motion & Double-Slit Interference',
          summary:
            'Explore why magnetic forces curve charged beams without changing speed and how path difference shapes interference fringes.',
          estimatedMinutes: 8,
          standards: ['AP Physics 2 Units 5–6', 'NGSS HS-PS4-3'],
          prerequisiteLessonIds: ['phys-u1-l2'],
          visual: {
            kind: 'model-3d',
            modelId: 'lorentz-force',
            initialParams: { showVel: true, showForce: true },
            highlightHotspots: ['particle', 'bfield', 'helix'],
          },
          steps: [
            {
              id: 'phys-u1-l3-s1',
              kind: 'narrative',
              title: 'Why Magnetic Fields Steer Without Doing Work',
              bodyMarkdown:
                'Magnetic Lorentz force $\\mathbf{F}_B = q(\\mathbf{v} \\times \\mathbf{B})$ points strictly **perpendicular** to velocity $\\mathbf{v}$. Because perpendicular force applies zero work ($\\mathbf{F}_B \\cdot \\mathbf{v} = 0$), a pure magnetic field bends a charged particle into a tight **circle or helix** at **constant speed**!\n\nMeanwhile in optics, two coherent light waves emerging from slits separated by $d$ build bright interference fringes every spacing $\\Delta y \\approx \\frac{\\lambda L}{d}$.',
              callout: {
                tone: 'key-idea',
                text: 'Lorentz magnetic force does zero kinetic work (speed stays constant, direction curves); only electric fields E accelerate speed.',
              },
            },
            {
              id: 'phys-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Bend Helices in the 3D Lorentz Force Chamber',
              predictionPrompt:
                'If you double magnetic field strength B while keeping particle charge q and velocity v constant, what happens to the cyclotron radius r = mv / (|q|B)?',
              predictionChoices: [
                'Radius doubles (2r)',
                'Radius cuts in HALF (tighter spiral)',
                'Particle speed doubles',
                'Helix switches charge sign',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'lorentz-force',
                initialParams: { showVel: true, showForce: true },
                highlightHotspots: ['particle', 'helix'],
              },
              observeInstruction:
                'Increase magnetic field B and flip charge sign in the 3D Lorentz simulator while watching the force arrow remain perpendicular to velocity.',
              explainPrompt: 'What happens to helix handedness if particle charge flips from +q to −q?',
              explainOptions: [
                'F = q(v × B) reverses force direction, curving the helix in the opposite sense',
                'Radius shrinks to zero',
                'Magnetic force turns parallel to v',
                'Kinetic energy becomes negative',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Negating q flips F_B = −|q|(v × B), curling electrons opposite to protons while radius mv/(|q|B) tightens as B increases.',
            },
            {
              id: 'phys-u1-l3-s3',
              kind: 'worked-example',
              title: 'Scaling Double-Slit Fringe Spacing',
              problemMarkdown:
                'Green light ($\\lambda = 532\\text{ nm}$) illuminates double slits $d = 0.2\\text{ mm}$ projecting onto a wall $L = 2\\text{ m}$ away. How does $\\Delta y$ change if slits move $2\\times$ farther apart?',
              steps: [
                {
                  label: 'Examine interference scaling law Δy = λL / d',
                  expressionOrAction: 'd sits in the denominator -> Δy ∝ 1/d.',
                  whyNote: 'Wider slits mean a smaller angle sin θ = λ/d suffices to add 1 whole wavelength of path delay.',
                },
                {
                  label: 'Scale d -> 2d',
                  expressionOrAction: 'Δy_new = ½ Δy_old (fringes pack twice as tightly!).',
                  whyNote: 'Counter-intuitive inverse dependence—narrower slits produce wider diffraction/interference fringes!',
                },
              ],
            },
            {
              id: 'phys-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Photon Energy & Wavelength Ordering',
              question: {
                type: 'order',
                prompt: 'Order visible light wavelengths from SHORTEST wavelength (highest photon energy) to LONGEST:',
                options: ['Violet (~400 nm)', 'Blue (~470 nm)', 'Green (~530 nm)', 'Red (~680 nm)'],
                correct: [0, 1, 2, 3],
                explanation: 'By E = hc/λ, shorter wavelengths pack higher energy per photon: violet > blue > green > red.',
                points: 15,
              },
            },
            {
              id: 'phys-u1-l3-s5',
              kind: 'synthesis',
              title: 'Physics Starter Track Complete',
              takeaways: [
                'Lorentz force q(E + v × B): E changes speed; pure B bends trajectory radius r = mv/(|q|B) at constant speed.',
                'Double-slit fringe spacing Δy = λL/d narrows when slit separation d grows.',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'diagram-scout', packId: 'astrophysics-orbital-mechanics' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'phys-u1-l3-fc1',
              front: 'Cyclotron radius formula in a uniform magnetic field B',
              back: 'r = m v_⊥ / (|q| B), balancing magnetic force |q|vB against centripetal force mv²/r.',
              explanation: 'Frequency ω = |q|B/m depends only on charge-to-mass ratio, independent of speed (non-relativistic).',
              interleave: true,
            },
            {
              id: 'phys-u1-l3-fc2',
              front: 'Why can a pure static magnetic field NEVER change a charged particle’s kinetic energy?',
              back: 'F_B = q(v × B) is always perpendicular to velocity v, so instantaneous power F_B · v = 0.',
              explanation: 'Work-energy theorem guarantees ΔK = 0.',
              interleave: true,
            },
            {
              id: 'phys-u1-l3-fc3',
              front: 'Constructive path-difference condition in Young’s double-slit experiment',
              back: 'd sin θ = m λ for integer m = 0, ±1, ±2, ... (bright fringes); half-integers (m + ½)λ yield dark destructive fringes.',
              explanation: 'Matches integer vs half-cycle phase overlap.',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

const CHEM_TRACK: CurriculumTrack = {
  id: 'track-chemical-bonding-vsepr',
  slug: 'chemical-bonding-vsepr',
  packId: 'chemical-bonding-vsepr',
  title: 'Chemistry: Bonding, Stoichiometry & Thermo',
  category: 'Science',
  subject: 'Chemistry',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: ['track-algebra-linear-systems'],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'chem-u1',
      title: '3D Molecular Geometry, Titration Curves & Carnot Thermodynamics',
      anchoringPhenomenon:
        'Invisible lone pairs compress water’s bond angle to 104.5°, buffers flatten pH titration curves near pKa, and temperature limits heat-engine work output.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'chem-u1-l1',
          unitId: 'chem-u1',
          title: 'VSEPR Electron Domains & Lone-Pair Compression',
          summary:
            'Predict 3D molecular shapes and bond polarity from steric number and nonbonding electron repulsion.',
          estimatedMinutes: 8,
          standards: ['AP Chemistry Unit 2', 'NGSS HS-PS1-2'],
          prerequisiteLessonIds: [],
          visual: {
            kind: 'model-3d',
            modelId: 'vsepr',
            initialParams: { angles: true },
            highlightHotspots: ['central', 'ligand', 'lonepair', 'angle'],
          },
          steps: [
            {
              id: 'chem-u1-l1-s1',
              kind: 'narrative',
              title: 'Electron Clouds Push Back in Three Dimensions',
              bodyMarkdown:
                'Atoms do not lie flat on paper: negatively charged electron regions repel into 3D space as far apart as geometry permits (**VSEPR**). Two domains spread to **180°** linear; three form **120°** trigonal planar; four form **109.5°** tetrahedral.\n\nCrucially, **lone pairs** hug only one nucleus and spread wider laterally than shared bonding pairs—squeezing adjacent bonds inward ($\\text{CH}_4\\,109.5^\\circ \\to \\text{NH}_3\\,107^\\circ \\to \\text{H}_2\\text{O}\\,104.5^\\circ$).',
              callout: {
                tone: 'key-idea',
                text: 'Separate Electron-Domain Geometry (counts bonds + lone pairs) from Molecular Shape (atoms only—what X-ray/spectroscopy sees)!',
              },
            },
            {
              id: 'chem-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Compare Methane, Ammonia & Water in 3D VSEPR',
              predictionPrompt:
                'Both methane (CH₄) and water (H₂O) have 4 electron domains around the central atom (tetrahedral domain geometry). Why is H₂O bent at ~104.5° rather than 109.5°?',
              predictionChoices: [
                'Hydrogen atoms attract each other covalently',
                'Oxygen carries 2 bulky lone pairs whose strong LP–LP and LP–BP repulsions compress the two O–H bonds together',
                'Oxygen has lower electronegativity than carbon',
                'Water only forms sp hybrid orbitals',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'vsepr',
                initialParams: { angles: true, lonePairs: true },
                highlightHotspots: ['lonepair', 'angle'],
              },
              observeInstruction:
                'Switch between 4-domain molecules in the 3D VSEPR viewer and click the lonepair and angle hotspots to watch bond angle compression.',
              explainPrompt:
                'Rank electron-domain repulsions from STRONGEST to WEAKEST:',
              explainOptions: [
                'LP–LP > LP–BP > BP–BP',
                'BP–BP > LP–BP > LP–LP',
                'LP–BP > BP–BP > LP–LP',
                'All three have identical magnitude',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Because unshared lone pairs occupy broader angular volume near the central nucleus, LP–LP repulsion squeezes H–O–H down to 104.5°.',
            },
            {
              id: 'chem-u1-l1-s3',
              kind: 'worked-example',
              title: 'Checking Overall Polarity via Symmetry',
              problemMarkdown: 'Why is $\\text{CO}_2$ nonpolar even though each $\\text{C}=\\text{O}$ bond is strongly polar, whereas $\\text{H}_2\\text{O}$ is polar?',
              steps: [
                {
                  label: 'Determine VSEPR shape and dipole directions',
                  expressionOrAction: 'CO₂: 2 double bonds, 0 lone pairs -> 180° linear. O=C=O bond dipoles point oppositely.',
                  whyNote: 'Treat each bond polarity as a 3D vector pointing toward the more electronegative atom.',
                },
                {
                  label: 'Vector-sum bond dipoles',
                  expressionOrAction: 'In linear CO₂, equal dipoles cancel to zero net dipole; in bent 104.5° H₂O, both dipoles add toward oxygen!',
                  whyNote: 'Symmetric domain shapes cancel bond dipoles ONLY when all surrounding ligands match and no asymmetric lone pairs tilt them.',
                },
              ],
            },
            {
              id: 'chem-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Lone Pair Angle Check',
              question: {
                type: 'mcq',
                prompt: 'Which molecule has a tetrahedral electron-domain geometry (4 domains) with 1 lone pair and ~107° trigonal pyramidal bond angle?',
                options: ['CO₂', 'BF₃', 'NH₃ (ammonia)', 'CH₄ (methane)'],
                correct: 2,
                explanation: 'NH₃ has 3 N–H bonds plus 1 lone pair = 4 domains, producing a trigonal pyramidal ~107° molecular shape.',
                points: 10,
              },
            },
            {
              id: 'chem-u1-l1-s5',
              kind: 'synthesis',
              title: '3D Molecular Shapes Locked',
              takeaways: [
                'Steric number counts sigma bonds + lone pairs (multiple bonds count as ONE electron domain).',
                'Lone pairs compress bond angles and break symmetry unless arranged opposingly (like square planar XeF₄ or linear XeF₂).',
              ],
              nextQuizIndex: 0,
              arcadeLaunch: { mode: 'diagram-scout', packId: 'chemical-bonding-vsepr' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'chem-u1-l1-fc1',
              front: 'Double and triple bonds in VSEPR steric number counting',
              back: 'A double or triple bond counts as ONE electron domain (though slightly bulkier than a single bond).',
              explanation: 'All pi electrons sit along the same internuclear axis as the sigma bond.',
              interleave: true,
            },
            {
              id: 'chem-u1-l1-fc2',
              front: 'Ideal bond angles for steric numbers 2, 3, and 4',
              back: '2: 180° (linear); 3: 120° (trigonal planar); 4: 109.5° (tetrahedral).',
              explanation: 'Lone pairs reduce these bond angles by ~2–2.5° per pair.',
              interleave: true,
            },
            {
              id: 'chem-u1-l1-fc3',
              front: 'Condition for a molecule with polar bonds to be nonpolar overall',
              back: 'Bond dipole vectors must sum symmetrically to zero (e.g., linear CO₂, trigonal planar BF₃, tetrahedral CCl₄, octahedral SF₆).',
              explanation: 'Bent (H₂O) and trigonal pyramidal (NH₃) molecules retain a nonzero net dipole moment.',
              interleave: true,
            },
          ],
        },
        {
          id: 'chem-u1-l2',
          unitId: 'chem-u1',
          title: 'Acid-Base Titration Curves, pKa & Buffers',
          summary:
            'Locate buffer plateaus, half-equivalence points (pH = pKa), and weak vs strong equivalence pH transitions.',
          estimatedMinutes: 9,
          standards: ['AP Chemistry Unit 8', 'NGSS HS-PS1-6'],
          prerequisiteLessonIds: ['chem-u1-l1'],
          visual: { kind: 'model-2d', modelId: 'acid-base-titration-2d' },
          steps: [
            {
              id: 'chem-u1-l2-s1',
              kind: 'narrative',
              title: 'Why Buffer Plateaus Resist pH Changes Until Equivalence',
              bodyMarkdown:
                'Add strong base $\\text{OH}^-$ dropwise to a weak acid $\\text{HA}$: at first, $\\text{OH}^-$ converts $\\text{HA}$ into its conjugate base $\\text{A}^-$. As long as both weak acid and conjugate base coexist in comparable amounts, the **Henderson–Hasselbalch** ratio $\\text{pH} = \\text{p}K_a + \\log_{10}\\left(\\frac{[\\text{A}^-]}{[\\text{HA}]}\\right)$ creates a flat **buffer zone**.\n\nExactly **halfway** to equivalence, $[\\text{A}^-] = [\\text{HA}]$, so **$\\text{pH} = \\text{p}K_a$**! Once all $\\text{HA}$ is neutralized at equivalence, only weak base $\\text{A}^-$ remains, driving **equivalence pH > 7**.',
              callout: {
                tone: 'key-idea',
                text: 'Strong acid + strong base equates at pH = 7.00; weak acid + strong base equates ABOVE pH 7 because conjugate base A⁻ hydrolyzes water!',
              },
            },
            {
              id: 'chem-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Explore Buffer Region & Equivalence Steepness',
              predictionPrompt:
                'When titrating 25.0 mL of weak acetic acid (Ka = 1.8×10⁻⁵, pKa = 4.74) with equal-molarity NaOH, where is buffer resistance MAXIMAL and what is pH at half-equivalence?',
              predictionChoices: [
                'At pH = 7.00 after all acid reacts',
                'At 12.5 mL added NaOH (half-equivalence), where [HA] = [A⁻] and pH = pKa = 4.74',
                'At 0 mL added NaOH',
                'At 50 mL added NaOH',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'acid-base-titration-2d' },
              observeInstruction:
                'Step volume added in the 2D Titration Curve model from 0 mL through half-equivalence and observe the slope flatten at pKa before shooting vertically at V_eq.',
              explainPrompt: 'Why does equivalence point lie ABOVE pH 7 for weak acid + strong base?',
              explainOptions: [
                'At V_eq, all HA became conjugate base A⁻, which reacts with H₂O ⇌ HA + OH⁻ to make the solution basic',
                'Strong base NaOH never reaches pH 7',
                'Water ion product Kw changes at equivalence',
                'Protons jump back from the beaker walls',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Neutralization creates a solution of conjugate base A⁻ rather than inert spectator ions, making pH_eq > 7 (requiring an indicator like phenolphthalein).',
            },
            {
              id: 'chem-u1-l2-s3',
              kind: 'branching-scenario',
              title: 'Select the Right Titration Indicator',
              startNodeId: 'pick-ind',
              nodes: {
                'pick-ind': {
                  promptMarkdown:
                    'You titrate weak acid $\\text{HF}$ ($\\text{p}K_a = 3.17$) with $\\text{NaOH}$; equivalence sits around **pH 8.1**. Should you use methyl orange (changes pH 3.1–4.4) or phenolphthalein (changes pH 8.2–10.0)?',
                  choices: [
                    {
                      label: 'Phenolphthalein (8.2–10.0) sits right on the steep equivalence jump near pH 8.1',
                      nextNodeId: 'check-stoich',
                      feedback:
                        'Exact! Using methyl orange around pH 3.2 would change color right at the half-equivalence buffer plateau—way too early!',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Methyl orange (3.1–4.4), because HF has pKa = 3.17',
                      nextNodeId: 'pick-ind',
                      feedback:
                        'Wait: pH = pKa is HALF-equivalence (still half unneutralized HA!), NOT equivalence! Pick an indicator whose color flip overlaps the vertical jump around equivalence.',
                      outcome: 'unsafe',
                    },
                  ],
                },
                'check-stoich': {
                  promptMarkdown:
                    'At equivalence, 30.0 mL of 0.10 M HF took 15.0 mL of NaOH. What was [NaOH]?',
                  choices: [
                    {
                      label: '0.20 M (since M₁V₁ = M₂V₂ -> 0.10 × 30 / 15 = 0.20 M)',
                      nextNodeId: null,
                      feedback: 'Spot on! 0.0030 mol HF requires 0.0030 mol OH⁻ -> 0.0030 / 0.015 L = 0.20 M.',
                      outcome: 'optimal',
                    },
                    {
                      label: '0.05 M',
                      nextNodeId: null,
                      feedback: 'Half the volume needed twice the molarity (0.20 M) to supply equal moles!',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'chem-u1-l2-s4',
              kind: 'checkpoint',
              title: 'Limiting Reactant Moles Before Equilibrium',
              question: {
                type: 'fill',
                prompt: 'How many moles of NH₃ form when 2.0 mol N₂ reacts completely with 3.0 mol H₂ (N₂ + 3H₂ → 2NH₃)?',
                correct: '2',
                alternatives: ['2.0', '2 mol'],
                explanation: 'H₂ is limiting: 3.0 mol H₂ consumes 1.0 mol N₂ (1.0 mol N₂ excess) and yields exactly 2.0 mol NH₃.',
                points: 10,
              },
            },
            {
              id: 'chem-u1-l2-s5',
              kind: 'synthesis',
              title: 'Titration & Stoichiometry Takeaways',
              takeaways: [
                'Half-equivalence pH = pKa gives maximal buffer capacity; equivalence occurs when mol H⁺_orig = mol OH⁻_added.',
                'Match indicator pKa within ±1 unit of equivalence pH (NOT half-equivalence pKa!).',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'certainty-vault', packId: 'chemical-bonding-vsepr' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'chem-u1-l2-fc1',
              front: 'Henderson–Hasselbalch Equation',
              back: 'pH = pKa + log₁₀([A⁻] / [HA]). When [A⁻] = [HA] at half-equivalence, pH = pKa.',
              explanation: 'Quantifies buffer pH across changing conjugate ratios.',
              interleave: true,
            },
            {
              id: 'chem-u1-l2-fc2',
              front: 'Why is equivalence pH < 7 for strong acid + weak base (e.g., HCl + NH₃)?',
              back: 'Equivalence yields conjugate acid NH₄⁺, which donates protons to water to create acidic pH < 7.',
              explanation: 'Only strong acid + strong base equates at neutral pH 7.00 at 25°C.',
              interleave: true,
            },
            {
              id: 'chem-u1-l2-fc3',
              front: 'Universal shortcut to find the limiting reactant in a stoichiometry reaction',
              back: 'Divide each reactant’s moles by its stoichiometric coefficient; the SMALLEST quotient is limiting.',
              explanation: 'Directly identifies which supply runs out first.',
              interleave: true,
            },
          ],
        },
        {
          id: 'chem-u1-l3',
          unitId: 'chem-u1',
          title: 'Carnot Cycles, Heat Engines & ΔG Spontaneity',
          summary:
            'Connect Kelvin reservoir ratios in Carnot P-V loops to Gibbs free energy spontaneity ΔG = ΔH − TΔS.',
          estimatedMinutes: 8,
          standards: ['AP Chemistry Unit 9', 'AP Physics 2 Unit 2'],
          prerequisiteLessonIds: ['chem-u1-l2'],
          visual: {
            kind: 'model-3d',
            modelId: 'carnot-cycle',
            initialParams: { showHeatFlow: true },
            highlightHotspots: ['piston', 'hot-res', 'cold-res', 'pv-loop'],
          },
          steps: [
            {
              id: 'chem-u1-l3-s1',
              kind: 'narrative',
              title: 'Why No Engine Converts 100% of Heat to Work',
              bodyMarkdown:
                'Running a reversible **Carnot engine** between Kelvin temperatures $T_H$ and $T_C$ encloses net work equal to the $P$-$V$ loop area, with maximum possible efficiency **$\\eta = 1 - \\frac{T_C}{T_H}$**.\n\nNotice **absolute Kelvin ($\\text{K} = ^\\circ\\text{C} + 273.15$)** is mandatory: unless a cold sink hits $0\\text{ K}$ (impossible by the Third Law), waste heat $Q_C > 0$ MUST exit to keep entropy from decreasing—the same Second Law governing chemical spontaneity **$\\Delta G = \\Delta H - T\\Delta S < 0$**!',
              callout: {
                tone: 'pitfall',
                text: 'Never plug °C or °F into η = 1 − T_C/T_H or PV = nRT! Always convert Celsius -> Kelvin (+273.15) first.',
              },
            },
            {
              id: 'chem-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Test Carnot Efficiency in the 3D Piston Engine',
              predictionPrompt:
                'A Carnot engine draws heat at T_H = 600 K and exhausts at T_C = 300 K. What maximum fraction of Q_H can become mechanical work?',
              predictionChoices: ['100%', '75%', '50% (1 − 300/600 = 0.50)', '25%'],
              correctPredictionIndex: 2,
              visual: {
                kind: 'model-3d',
                modelId: 'carnot-cycle',
                initialParams: { tempHot: 600, tempCold: 300, showHeatFlow: true },
                highlightHotspots: ['hot-res', 'cold-res', 'pv-loop'],
              },
              observeInstruction:
                'Examine the 3D Carnot piston and four-stroke P-V diagram: two isothermal legs (constant T) connected by two adiabatic legs (Q = 0).',
              explainPrompt:
                'Which two strokes exchange heat with the hot and cold reservoirs, and which do NOT?',
              explainOptions: [
                'Isothermal expansion absorbs Q_H and isothermal compression dumps Q_C; both adiabatic strokes have Q = 0',
                'Adiabatic strokes exchange all heat',
                'All four strokes absorb Q_H',
                'No work occurs on isothermal paths',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'At T_H = 600 K and T_C = 300 K, exactly half of Q_H does net PV-loop work while half rejects as Q_C to satisfy ΔS_total ≥ 0.',
            },
            {
              id: 'chem-u1-l3-s3',
              kind: 'worked-example',
              title: 'Predicting Temperature Dependence of ΔG = ΔH − TΔS',
              problemMarkdown:
                'Melting ice has $\\Delta H > 0$ (endothermic) and $\\Delta S > 0$ (liquid is more disordered than crystal). When is melting spontaneous?',
              steps: [
                {
                  label: 'Examine signs in ΔG = ΔH − TΔS',
                  expressionOrAction: 'ΔG = (+ΔH) − T(+ΔS)',
                  whyNote: 'The enthalpy term opposes melting (+), while the −TΔS entropy term favors it (−).',
                },
                {
                  label: 'Compare at high vs low T',
                  expressionOrAction: 'At T > ΔH/ΔS (> 273 K), TΔS dominates -> ΔG < 0 (spontaneous!). Below 273 K, freezing dominates.',
                  whyNote: 'Any reaction with ΔH > 0 and ΔS > 0 turns spontaneous only above threshold temperature T = ΔH/ΔS.',
                },
              ],
            },
            {
              id: 'chem-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Order Carnot Cycle Stages',
              question: {
                type: 'order',
                prompt: 'Order the four stages of an idealized forward Carnot power cycle:',
                options: [
                  'Isothermal expansion at T_H (absorbs Q_H)',
                  'Adiabatic expansion (cools gas from T_H down to T_C)',
                  'Isothermal compression at T_C (rejects Q_C)',
                  'Adiabatic compression (heats gas from T_C back to T_H)',
                ],
                correct: [0, 1, 2, 3],
                explanation: 'Isothermal expand at T_H -> adiabatic cool -> isothermal compress at T_C -> adiabatic heat back to T_H.',
                points: 15,
              },
            },
            {
              id: 'chem-u1-l3-s5',
              kind: 'synthesis',
              title: 'Chemistry Thermodynamics Track Complete',
              takeaways: [
                'Carnot η_max = 1 − T_C/T_H sets the universal Second-Law ceiling (in Kelvin).',
                'ΔG = ΔH − TΔS < 0 determines spontaneity; endothermic (+ΔH) reactions become favorable only with +ΔS at high T.',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'certainty-vault', packId: 'chemical-bonding-vsepr' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'chem-u1-l3-fc1',
              front: 'Maximum Carnot efficiency formula and required temperature scale',
              back: 'η_max = 1 − (T_C / T_H), where both T_C and T_H MUST be in absolute Kelvin (K = °C + 273.15).',
              explanation: 'Only zero-Kelvin cold sinks would allow 100% thermal efficiency.',
              interleave: true,
            },
            {
              id: 'chem-u1-l3-fc2',
              front: 'Four sign combinations of ΔG = ΔH − TΔS',
              back: '(−ΔH, +ΔS): always spontaneous; (+ΔH, −ΔS): never spontaneous; (+ΔH, +ΔS): spontaneous at high T; (−ΔH, −ΔS): spontaneous at low T.',
              explanation: 'Exothermic + entropy-increasing reactions favor all temperatures.',
              interleave: true,
            },
            {
              id: 'chem-u1-l3-fc3',
              front: 'Does an adiabatic expansion or compression exchange heat Q?',
              back: 'No! Adiabatic means Q = 0; work directly lowers/raises internal energy U and temperature T.',
              explanation: 'First Law ΔU = Q + W reduces to ΔU = W.',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

const BIO_TRACK: CurriculumTrack = {
  id: 'track-cellular-molecular-biology',
  slug: 'cellular-molecular-biology',
  packId: 'cellular-molecular-biology',
  title: 'Biology: Cells, Genetics & Neurobiology',
  category: 'Science',
  subject: 'Biology',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'bio-u1',
      title: 'DNA Replication, Synaptic Signaling & Population Genetics',
      anchoringPhenomenon:
        'Antiparallel DNA polymerase chemistry splits a single replication fork into continuous and stitched Okazaki strands, while voltage-gated ion channels convert frequency into chemical pulses.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'bio-u1-l1',
          unitId: 'bio-u1',
          title: 'Organelle Compartments & Antiparallel DNA Forks',
          summary:
            'Trace the endomembrane protein highway and see why 5′ -> 3′ synthesis forces leading vs lagging Okazaki strands.',
          estimatedMinutes: 9,
          standards: ['AP Biology Units 2 & 6', 'NGSS HS-LS1-1'],
          prerequisiteLessonIds: [],
          visual: {
            kind: 'model-3d',
            modelId: 'dna-fork',
            initialParams: { showHBonds: true, showEnds: true },
            highlightHotspots: ['helicase', 'leading', 'okazaki', '5prime-3prime'],
          },
          steps: [
            {
              id: 'bio-u1-l1-s1',
              kind: 'narrative',
              title: 'Why DNA Polymerases Only Build One Way (5′ -> 3′)',
              bodyMarkdown:
                'Every DNA polymerase can attach an incoming nucleotide ONLY onto an exposed **3′ −OH** sugar group, growing new chains strictly **5′ -> 3′**. Because the two parental DNA strands run **antiparallel** ($3\'\\to 5\'$ paired opposite $5\'\\to 3\'$), unzipping the replication fork via **helicase** lets one side build continuously (**leading strand**) while the opposite template forces short backward bursts (**Okazaki fragments** on the **lagging strand**, later sealed by **DNA ligase**).',
              callout: {
                tone: 'key-idea',
                text: 'Think directional chemistry: DNA polymerase reads template 3′ -> 5′ so the NEW complementary strand grows 5′ -> 3′.',
              },
            },
            {
              id: 'bio-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Inspect Fork Directionality in 3D',
              predictionPrompt:
                'If DNA ligase suddenly lost function while helicase, primase, and DNA polymerase III stayed normal, what would accumulate inside dividing cells?',
              predictionChoices: [
                'No replication begins at all',
                'Continuous leading strand completes normally, but the lagging strand remains fragmented into unjoined Okazaki pieces',
                'Leading strand breaks into short fragments while lagging strand finishes',
                'Both strands fuse covalently into RNA',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'dna-fork',
                initialParams: { showHBonds: true, showEnds: true },
                highlightHotspots: ['helicase', 'leading', 'okazaki', '5prime-3prime'],
              },
              observeInstruction:
                'Explore the 3D DNA Replication Fork with 5′-3′ polarity labels visible and click helicase, leading, and okazaki hotspots.',
              explainPrompt: 'Why does DNA synthesis ALWAYS require a short RNA primer first?',
              explainOptions: [
                'DNA polymerase cannot initiate a strand de novo—only Primase starts from scratch to leave a free 3′-OH hook',
                'Helicase can only cut RNA bonds',
                'Okazaki fragments are made permanently of RNA',
                'ATP provides phosphate only to ribose',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Without an existing 3′-OH end, DNA polymerase stalls; Primase lays the RNA starter, DNA Pol extends 5′ -> 3′, and DNA ligase seals the final nick.',
            },
            {
              id: 'bio-u1-l1-s3',
              kind: 'worked-example',
              title: 'Writing Complementary Antiparallel Strands',
              problemMarkdown:
                'Given template DNA **$5\'\\text{-ATGCCGT-3\'}$**, write the exact complementary daughter DNA strand with polarity.',
              steps: [
                {
                  label: 'Flip end polarity from 5′-3′ to antiparallel 3′-5′',
                  expressionOrAction: 'Template: 5′-ATGCCGT-3′  =>  Complement starts at 3′ end aligned under 5′.',
                  whyNote: 'Antiparallel base pairing keeps sugar-phosphate backbones pointing oppositely.',
                },
                {
                  label: 'Apply Chargaff Watson-Crick pairing (A-T, G-C)',
                  expressionOrAction: '3′-TACGGCA-5′ (equivalent to 5′-ACGGCAT-3′ when read 5′->3′!).',
                  whyNote: 'Note thymine (T) replaces uracil (U) because this is DNA replication, not transcription.',
                },
              ],
            },
            {
              id: 'bio-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Order Secreted Protein Trafficking',
              question: {
                type: 'order',
                prompt: 'Trace a secreted protein through the eukaryotic endomembrane system:',
                options: [
                  'Bound ribosome on Rough ER translates the polypeptide into the lumen',
                  'COPII transport vesicle buds from Rough ER to cis-Golgi',
                  'Golgi apparatus modifies glycosylation and sorts cargo',
                  'Secretory vesicle fuses with plasma membrane via exocytosis',
                ],
                correct: [0, 1, 2, 3],
                explanation: 'Rough ER -> transport vesicle -> Golgi stack -> secretory exocytosis.',
                points: 10,
              },
            },
            {
              id: 'bio-u1-l1-s5',
              kind: 'synthesis',
              title: 'Cellular Architecture & Replication Locked',
              takeaways: [
                'Helicase unwinds H-bonds; Primase drops RNA 3′-OH starter; DNA Pol builds 5′->3′ continuously on leading strand and via Okazaki fragments on lagging strand.',
                'Secreted proteins travel Rough ER -> Golgi -> exocytic vesicle -> plasma membrane.',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'sequence-architect', packId: 'cellular-molecular-biology' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'bio-u1-l1-fc1',
              front: 'Key enzyme quartet of the lagging DNA strand',
              back: 'Helicase (unzips), Primase (lays RNA 3′-OH primer), DNA Polymerase (5′->3′ Okazaki fragments + primer replacement), DNA Ligase (seals phosphodiester nicks).',
              explanation: 'Topoisomerase relieves ahead-of-fork supercoiling stress.',
              interleave: true,
            },
            {
              id: 'bio-u1-l1-fc2',
              front: 'Why are mitochondrial inner membranes folded into cristae?',
              back: 'Maximizes membrane surface area for electron transport chains and ATP synthase oxidative phosphorylation.',
              explanation: 'Structure directly multiplies ATP output per organelle volume.',
              interleave: true,
            },
            {
              id: 'bio-u1-l1-fc3',
              front: 'Rule for strand growth direction during BOTH replication and transcription',
              back: 'All nucleic acid polymerases synthesize new strands strictly 5′ -> 3′ (adding onto the 3′-OH group).',
              explanation: 'Template strand is read antiparallel 3′ -> 5′.',
              interleave: true,
            },
          ],
        },
        {
          id: 'bio-u1-l2',
          unitId: 'bio-u1',
          title: 'Synaptic Transmission & Action Potential Coding',
          summary:
            'Trace how electrical spikes trigger calcium-dependent vesicle fusion across chemical synapses.',
          estimatedMinutes: 8,
          standards: ['AP Biology Unit 4', 'NGSS HS-LS1-3'],
          prerequisiteLessonIds: ['bio-u1-l1'],
          visual: {
            kind: 'model-3d',
            modelId: 'synapse-neuro',
            initialParams: { caGlow: true, highlightReceptors: true },
            highlightHotspots: ['vesicles', 'calcium', 'receptors', 'reuptake'],
          },
          steps: [
            {
              id: 'bio-u1-l2-s1',
              kind: 'narrative',
              title: 'Converting Electrical Frequency Into Chemical Quantized Signals',
              bodyMarkdown:
                'Every axonal **action potential** fires at the exact same all-or-none peak amplitude (+30 to +40 mV): stronger stimuli encode intensity through higher **firing frequency** (Hz), never taller spikes!\n\nWhen depolarization reaches the axon terminal, voltage-gated **$\\text{Ca}^{2+}$ channels** swing open. Calcium influx triggers SNARE proteins to fuse synaptic **vesicles** with the cleft membrane, releasing neurotransmitter to bind postsynaptic ligand-gated channels before **reuptake** clears the signal.',
              callout: {
                tone: 'key-idea',
                text: 'Presynaptic spike = voltage-gated Na⁺/K⁺; Terminal release trigger = voltage-gated Ca²⁺ influx; Postsynaptic EPSP/IPSP = ligand-gated ion channels.',
              },
            },
            {
              id: 'bio-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Modulate Firing Rate & Reuptake in the 3D Synapse',
              predictionPrompt:
                'What happens to postsynaptic receptor activation if extracellular Ca²⁺ is chelated (removed) from the bath while presynaptic action potentials still fire?',
              predictionChoices: [
                'Vesicles fuse even faster without calcium',
                'Action potentials still arrive, but without Ca²⁺ influx, vesicle exocytosis fails and synaptic transmission halts',
                'Na⁺ rushes across the synaptic cleft directly',
                'Receptors permanently close',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'synapse-neuro',
                initialParams: { caGlow: true, highlightReceptors: true },
                highlightHotspots: ['calcium', 'vesicles', 'receptors', 'reuptake'],
              },
              observeInstruction:
                'Adjust action-potential frequency and reuptake rate sliders in the 3D Synapse viewer while tracking Ca²⁺ glow and receptor occupancy.',
              explainPrompt:
                'How does an SSRI or reuptake blocker increase postsynaptic receptor signaling without boosting vesicle synthesis?',
              explainOptions: [
                'Slowing transporter reuptake keeps released neurotransmitter lingering longer in the cleft to repeatedly bind receptors',
                'It increases Ca²⁺ voltage threshold',
                'It turns inhibitory GABA into glutamate',
                'It shortens axon length',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Reducing reuptake rate leaves neurotransmitter in the synaptic cleft longer, sustaining receptor binding after each pulse.',
            },
            {
              id: 'bio-u1-l2-s3',
              kind: 'worked-example',
              title: 'Depolarizing Na⁺ Influx vs Repolarizing K⁺ Efflux',
              problemMarkdown: 'Compare ion movement during the rising vs falling phase of a neuron action potential.',
              steps: [
                {
                  label: 'Rising phase (threshold ~−55 mV -> +35 mV)',
                  expressionOrAction: 'Fast voltage-gated Na⁺ channels open -> Na⁺ rushes IN down electrochemical gradient.',
                  whyNote: 'Positive charge entering rapidly depolarizes membrane interior.',
                },
                {
                  label: 'Falling phase (+35 mV -> −80 mV undershoot)',
                  expressionOrAction: 'Na⁺ channels inactivate while delayed voltage-gated K⁺ channels open -> K⁺ exits OUT.',
                  whyNote: 'Positive charge leaving repolarizes the neuron and creates a refractory window ensuring one-way propagation.',
                },
              ],
            },
            {
              id: 'bio-u1-l2-s4',
              kind: 'checkpoint',
              title: 'Critical Ion Trigger for Exocytosis',
              question: {
                type: 'mcq',
                prompt: 'Which ion must enter the presynaptic axon bulb to trigger synaptic vesicle fusion with the membrane?',
                options: ['Sodium (Na⁺)', 'Potassium (K⁺)', 'Calcium (Ca²⁺)', 'Chloride (Cl⁻)'],
                correct: 2,
                explanation: 'Depolarization opens voltage-gated Ca²⁺ channels; intracellular Ca²⁺ binds synaptotagmin to drive vesicle fusion.',
                points: 10,
              },
            },
            {
              id: 'bio-u1-l2-s5',
              kind: 'synthesis',
              title: 'Neural Coding Summary',
              takeaways: [
                'All-or-none spikes encode stimulus strength via frequency (Hz); refractory periods keep spikes traveling forward.',
                'Ca²⁺ influx triggers vesicle fusion; neurotransmitter clearance relies on reuptake transporters or enzymatic breakdown.',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'step-detective', packId: 'cellular-molecular-biology' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'bio-u1-l2-fc1',
              front: 'How do neurons encode a louder sound or heavier touch if all action potentials share the same voltage peak?',
              back: 'Higher firing frequency (spikes per second) and recruiting more parallel sensory axons.',
              explanation: 'Individual spikes are amplitude-invariant (all-or-none).',
              interleave: true,
            },
            {
              id: 'bio-u1-l2-fc2',
              front: 'Two purposes of the refractory period after an action potential',
              back: 'Limits maximum firing frequency and prevents backward spike propagation down the axon.',
              explanation: 'Inactivated Na⁺ channels behind the wavefront cannot immediately reopen.',
              interleave: true,
            },
            {
              id: 'bio-u1-l2-fc3',
              front: 'How do myelin sheaths speed axon conduction without changing ion pumps?',
              back: 'Insulating internodes force current to jump cleanly between Nodes of Ranvier (saltatory conduction).',
              explanation: 'Cuts membrane capacitance and leakage dramatically.',
              interleave: true,
            },
          ],
        },
        {
          id: 'bio-u1-l3',
          unitId: 'bio-u1',
          title: 'Hardy-Weinberg Equilibrium & Natural Selection',
          summary:
            'Predict genotype frequencies p² + 2pq + q² = 1 and diagnose evolutionary forces shifting allele pools.',
          estimatedMinutes: 9,
          standards: ['AP Biology Unit 7', 'NGSS HS-LS4-2'],
          prerequisiteLessonIds: ['bio-u1-l2'],
          visual: { kind: 'model-2d', modelId: 'hardy-weinberg-selection-2d' },
          steps: [
            {
              id: 'bio-u1-l3-s1',
              kind: 'narrative',
              title: 'Null Baseline for Microevolution',
              bodyMarkdown:
                'With two alleles $A$ (frequency $p$) and $a$ (frequency $q = 1 - p$), random mating acts like multiplying $(p + q)^2 = 1$: genotype fractions become **$p^2$ (AA) $+ 2pq$ (Aa) $+ q^2$ (aa) $= 1$**.\n\nIf a real population matches those numbers across generations, **evolution is NOT occurring** at that locus! Whenever observed heterozygotes or homozygotes deviate, one of the 5 Hardy–Weinberg assumptions (**no selection, no mutation, no migration, large population/no drift, random mating**) has been broken.',
              callout: {
                tone: 'pitfall',
                text: 'NEVER try to find p directly from dominant-phenotype individuals (AA + Aa cannot be separated by look alone)! Always start from recessive phenotype count q² = aa / N, then take q = √(q²).',
              },
            },
            {
              id: 'bio-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Simulate Selection & Drift on Allele Trajectories',
              predictionPrompt:
                'In the Hardy-Weinberg simulator, suppose allele a is completely recessive lethal (homozygotes aa fail to survive), while Aa carriers survive fine. Over 20 generations, what happens to q?',
              predictionChoices: [
                'q drops immediately to 0 in 1 generation',
                'q drops quickly at first, then declines very slowly because most remaining a alleles hide safely inside Aa heterozygotes',
                'q increases to 1.0',
                'p drops to 0.50 and stops',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-2d', modelId: 'hardy-weinberg-selection-2d' },
              observeInstruction:
                'Dial down recessive fitness w_aa in the interactive 2D Hardy-Weinberg Selection explorer and trace why recessive alleles linger at low frequency.',
              explainPrompt: 'Why can selection not eliminate a rare recessive lethal allele instantly?',
              explainOptions: [
                'At small q, ratio 2pq / q² = 2p/q becomes huge—nearly all copies sit hidden in healthy Aa heterozygotes shielded from selection',
                'Because homozygous AA individuals spontaneously mutate into aa',
                'Because dominant alleles weaken over time',
                'Because p + q becomes greater than 1',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'For q = 0.01, carriers 2pq ≈ 0.02 outnumber affected homozygotes q² = 0.0001 by ~200:1, sheltering recessive alleles in heterozygotes!',
            },
            {
              id: 'bio-u1-l3-s3',
              kind: 'branching-scenario',
              title: 'Solve a Field Population Allele Frequency',
              startNodeId: 'hw-solve',
              nodes: {
                'hw-solve': {
                  promptMarkdown:
                    'Among **500 wild moths**, **455** have the dominant dark wing phenotype and **45** have the recessive pale phenotype ($aa$). What should you compute FIRST?',
                  choices: [
                    {
                      label: 'Set q² = 45 / 500 = 0.09 -> q = sqrt(0.09) = 0.30, so p = 0.70',
                      nextNodeId: 'het-count',
                      feedback: 'Textbook precision! Dominant count 455 mixes AA and Aa, whereas 45/500 gives q² unambiguously.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Set p² = 455 / 500 = 0.91 -> p = 0.95',
                      nextNodeId: 'hw-solve',
                      feedback: 'Careful—455/500 equals p² + 2pq, NOT p²! Start with homozygous recessive q² = 45/500.',
                      outcome: 'unsafe',
                    },
                  ],
                },
                'het-count': {
                  promptMarkdown: 'Using p = 0.70 and q = 0.30, how many of the 500 moths are heterozygous carriers (Aa)?',
                  choices: [
                    {
                      label: '2pq × 500 = 2(0.70)(0.30)(500) = 0.42 × 500 = 210 moths',
                      nextNodeId: null,
                      feedback: 'Exact! Check: 245 (AA) + 210 (Aa) + 45 (aa) = 500 moths total!',
                      outcome: 'optimal',
                    },
                    {
                      label: '0.70 × 0.30 × 500 = 105 moths',
                      nextNodeId: null,
                      feedback: 'Don’t forget the factor of 2 in 2pq (accounting for maternal A + paternal a AND maternal a + paternal A)!',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'bio-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Compute Recessive Genotype Percentage',
              question: {
                type: 'fill',
                prompt: 'In a Hardy-Weinberg population where allele frequency p = 0.60 (so q = 0.40), what percentage (0-100) of individuals are heterozygote carriers (2pq)?',
                correct: '48',
                alternatives: ['48%', '0.48'],
                explanation: '2pq = 2 × 0.60 × 0.40 = 0.48 = 48%.',
                points: 15,
              },
            },
            {
              id: 'bio-u1-l3-s5',
              kind: 'synthesis',
              title: 'Biology Starter Track Complete',
              takeaways: [
                'Start Hardy–Weinberg problems with homozygous recessive q² = n_aa / N -> q -> p = 1 − q -> 2pq.',
                'Five non-evolving equilibrium conditions: huge population, no gene flow, no mutation, random mating, equal fitness.',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'certainty-vault', packId: 'cellular-molecular-biology' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'bio-u1-l3-fc1',
              front: 'Allele frequency vs Genotype frequency equations in Hardy–Weinberg',
              back: 'Alleles: p + q = 1. Genotypes: p² (AA) + 2pq (Aa) + q² (aa) = 1.',
              explanation: 'Only true under equilibrium conditions.',
              interleave: true,
            },
            {
              id: 'bio-u1-l3-fc2',
              front: 'Five conditions required to prevent allele frequencies from evolving (Hardy–Weinberg)',
              back: '1) Very large population (no drift), 2) No migration (gene flow), 3) No net mutation, 4) Random mating, 5) No natural selection.',
              explanation: 'Violation of any single assumption drives change in gene pools.',
              interleave: true,
            },
            {
              id: 'bio-u1-l3-fc3',
              front: 'What is heterozygote advantage (balancing selection)?',
              back: 'When Aa has higher fitness than both AA and aa (e.g., sickle-cell trait against malaria), preserving both alleles stably at equilibrium.',
              explanation: 'Prevents either allele from reaching fixation (p=1 or q=1).',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

const EARTH_TRACK: CurriculumTrack = {
  id: 'track-earth-tectonic-systems',
  slug: 'earth-tectonic-systems',
  packId: 'earth-tectonic-systems',
  title: 'Earth Science: Plate Tectonics & Geodynamics',
  category: 'Science',
  subject: 'Earth Science',
  gradeBand: 'HS',
  license: 'MIT',
  sourceAttribution: 'OpenPath Original Authors (MIT)',
  prerequisiteTrackIds: [],
  srsInterleaveDefault: true,
  units: [
    {
      id: 'earth-u1',
      title: 'Subduction Kinematics, Axial Seasons & Slope Mechanics',
      anchoringPhenomenon:
        'Dense basaltic oceanic slabs plunge beneath continents along Benioff seismic ramps while Earth’s 23.4° axial tilt—not orbital distance—drives hemispheric seasons.',
      capstoneQuizIndex: 2,
      masteryGate: {
        policy: 'soft-recommended',
        minLessonCompletion: true,
        minQuizAccuracyPct: 75,
      },
      lessons: [
        {
          id: 'earth-u1-l1',
          unitId: 'earth-u1',
          title: 'Subduction Trenches, Volcanic Arcs & Benioff Zones',
          summary:
            'Connect crust density differences to oceanic subduction, flux melting, and deep earthquake hypocenters.',
          estimatedMinutes: 8,
          standards: ['NGSS HS-ESS2-1', 'NGSS HS-ESS1-5'],
          prerequisiteLessonIds: [],
          visual: {
            kind: 'model-3d',
            modelId: 'plate-tectonics',
            initialParams: { showVectors: true, showQuakes: true },
            highlightHotspots: ['trench', 'arc', 'benioff', 'convection'],
          },
          steps: [
            {
              id: 'earth-u1-l1-s1',
              kind: 'narrative',
              title: 'Density Decides Which Tectonic Plate Dives',
              bodyMarkdown:
                'Thin oceanic basalt (~3.0 g/cm³) sits **denser** than thick granitic continents (~2.7 g/cm³). When two plates converge, the denser oceanic lithosphere bends downward at a deep-sea **trench**, plunging along an inclined plane traced by shallow-to-deep **Wadati–Benioff** earthquakes.\n\nAt ~100 km depth, water baked out of the sinking crust drops mantle melting temperatures (**flux melting**), fueling an explosive continental **volcanic arc**.',
              callout: {
                tone: 'key-idea',
                text: 'Water lowers rock melting point (flux melting) right above a descending slab—explaining why stratovolcano rings shadow subduction trenches!',
              },
            },
            {
              id: 'earth-u1-l1-s2',
              kind: 'predict-observe-explain',
              title: 'Inspect Slab Earthquakes & Convection Plumes in 3D',
              predictionPrompt:
                'Moving progressively INLAND away from a coastal ocean trench across the continent, how do Wadati–Benioff earthquake depths change?',
              predictionChoices: [
                'Earthquakes stay strictly at the surface (< 5 km)',
                'Hypocenter depth steadily INCREASES down to ~670 km tracing the descending cold slab',
                'Earthquakes get shallower inland',
                'Only mid-ocean ridges produce earthquakes',
              ],
              correctPredictionIndex: 1,
              visual: {
                kind: 'model-3d',
                modelId: 'plate-tectonics',
                initialParams: { showVectors: true, showQuakes: true },
                highlightHotspots: ['trench', 'benioff', 'arc'],
              },
              observeInstruction:
                'Toggle seismic hypocenters in the 3D Plate Tectonics simulation and click trench, benioff, and arc hotspots along the subducting slab.',
              explainPrompt:
                'Why do S-waves disappear across Earth’s opposite side beyond ~103° angular distance from a quake?',
              explainOptions: [
                'Earth’s outer core is liquid metal, which has zero shear strength and cannot transmit transverse S-waves',
                'Continents absorb S-waves',
                'Mantle rock turns gaseous',
                'S-waves move faster than light in iron',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Shear S-waves require rigid shear elasticity; liquids block S-waves completely, proving our outer core is molten.',
            },
            {
              id: 'earth-u1-l1-s3',
              kind: 'worked-example',
              title: 'Relative Plate Convergence Across a Triple Junction',
              problemMarkdown:
                'Plate A moves east-north at $\\mathbf{u} = \\langle 30, 10 \\rangle$ mm/yr and Plate B approaches at $\\mathbf{v} = \\langle -6, -17 \\rangle$ mm/yr (relative sum). Find total vector speed.',
              steps: [
                {
                  label: 'Combine east-west and north-south vector components',
                  expressionOrAction: 'u + v = ⟨30 + (−6), 10 + (−17)⟩ = ⟨24, −7⟩ mm/yr',
                  whyNote: 'Always sum E/W (x) separately from N/S (y).',
                },
                {
                  label: 'Compute Euclidean velocity magnitude',
                  expressionOrAction: 'Speed = sqrt(24² + (−7)²) = sqrt(576 + 49) = sqrt(625) = 25 mm/yr.',
                  whyNote: 'Classic 7-24-25 Pythagorean triple yields 25 mm/yr cleanly.',
                },
              ],
            },
            {
              id: 'earth-u1-l1-s4',
              kind: 'checkpoint',
              title: 'Subduction Cross-Section Ordering',
              question: {
                type: 'order',
                prompt: 'Order these subduction features moving landward from open ocean onto the overriding continent:',
                options: [
                  'Abyssal plain on approaching oceanic plate',
                  'Deep-sea oceanic trench',
                  'Forearc accretionary wedge',
                  'Continental volcanic arc (~100 km above slab)',
                ],
                correct: [0, 1, 2, 3],
                explanation: 'Ocean basin -> deep trench -> scraped accretionary prism -> volcanic arc inland.',
                points: 10,
              },
            },
            {
              id: 'earth-u1-l1-s5',
              kind: 'synthesis',
              title: 'Plate Subduction Takeaways',
              takeaways: [
                'Higher basaltic density (~3.0 vs ~2.7 g/cm³) drives oceanic crust beneath continental lithosphere.',
                'Wadati–Benioff quakes trace slab angle; flux melting feeds arcs; outer-core S-wave shadows prove liquid outer core.',
              ],
              nextQuizIndex: 1,
              arcadeLaunch: { mode: 'diagram-scout', packId: 'earth-tectonic-systems' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'earth-u1-l1-fc1',
              front: 'Oceanic vs Continental Crust typical rock type and density',
              back: 'Oceanic: basalt/gabbro (~3.0 g/cm³); Continental: granite/felsic (~2.7 g/cm³).',
              explanation: 'Explains why oceanic lithosphere subducts beneath continents.',
              interleave: true,
            },
            {
              id: 'earth-u1-l1-fc2',
              front: 'What seismic observation proves Earth’s outer core is liquid?',
              back: 'An S-wave shadow zone beyond ~103° angular distance because transverse shear S-waves cannot travel through liquids.',
              explanation: 'Longitudinal P-waves refract across the core but still emerge.',
              interleave: true,
            },
            {
              id: 'earth-u1-l1-fc3',
              front: 'Energy jump per +1.0 step on the Moment Magnitude (M_w) scale',
              back: '~31.6× released seismic energy (10^1.5×), and 10× ground wave amplitude.',
              explanation: 'Logarithmic scale: +2.0 step multiplies energy by ~1,000×!',
              interleave: true,
            },
          ],
        },
        {
          id: 'earth-u1-l2',
          unitId: 'earth-u1',
          title: 'Axial Tilt, Solar Incidence Angle & Seasons',
          summary:
            'Explain global seasons via Earth’s 23.4° axial obliquity spreading or concentrating beam energy per square meter.',
          estimatedMinutes: 8,
          standards: ['NGSS MS-ESS1-1', 'NGSS HS-ESS2-4'],
          prerequisiteLessonIds: ['earth-u1-l1'],
          visual: { kind: 'model-3d', modelId: 'seasons-axial-tilt-3d' },
          steps: [
            {
              id: 'earth-u1-l2-s1',
              kind: 'narrative',
              title: 'Why Winter Happens When Earth Is Slightly CLOSEST to the Sun',
              bodyMarkdown:
                'Earth’s orbit is nearly circular (e ≈ 0.017)—in fact, Earth hits **perihelion** (closest to Sun) in early **January**, mid-winter for the Northern Hemisphere! What actually powers seasons is our constant **$23.4^\\circ$ axial tilt**: whichever hemisphere leans toward the Sun receives **higher solar elevation angles** (concentrating photons onto smaller ground area by $\\sin(\\text{alt})$) AND **longer daylight hours**.',
              callout: {
                tone: 'pitfall',
                text: 'Do NOT blame winter on Earth being farther from the Sun—opposite hemispheres experience opposite seasons simultaneously on the exact same date!',
              },
            },
            {
              id: 'earth-u1-l2-s2',
              kind: 'predict-observe-explain',
              title: 'Tilt Planetary Obliquity in the 3D Seasons Model',
              predictionPrompt:
                'If a planet orbited with ZERO axial tilt (0° perpendicular to its orbital plane), how would seasons behave over one full year?',
              predictionChoices: [
                'Summers and winters would reverse twice faster',
                'Seasonal variation from tilt would vanish completely (every latitude stays stuck in permanent equinox daylight)',
                'Days would last 6 months everywhere',
                'The equator would freeze solid',
              ],
              correctPredictionIndex: 1,
              visual: { kind: 'model-3d', modelId: 'seasons-axial-tilt-3d' },
              observeInstruction:
                'Sweep orbital day/season and adjust axial tilt in the 3D Seasons Axial Tilt model, comparing northern vs southern solar beam angles.',
              explainPrompt: 'Why does a low sun angle (say 30°) deliver half as much power per m² as overhead noon (90°)?',
              explainOptions: [
                'The same cylindrical sunbeam spreads across 1 / sin(30°) = 2× as much surface area, halving intensity (W/m²)',
                'Photons slow down near the poles',
                'Magnetic fields block horizontal rays',
                'Albedo drops to zero at sunset',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Insolation flux obeys I = I₀ sin(elevation): slanting beams spread identical wattage over larger ground patches AND travel through thicker atmosphere.',
            },
            {
              id: 'earth-u1-l2-s3',
              kind: 'branching-scenario',
              title: 'Debunk an Orbital-Distance Season Misconception',
              startNodeId: 'season-myth',
              nodes: {
                'season-myth': {
                  promptMarkdown:
                    'A classmate argues: *"July is hot everywhere on Earth because Earth moves closer to the Sun in July."* What single everyday fact refutes that claim immediately?',
                  choices: [
                    {
                      label: 'In July, Australia and Argentina are in mid-WINTER while Canada is in summer—both share the exact same Sun distance!',
                      nextNodeId: 'daylight',
                      feedback: 'Irrefutable! Opposite hemispheric seasons on the same date prove axial tilt, not orbital distance, drives seasons.',
                      outcome: 'optimal',
                    },
                    {
                      label: 'Because the Moon blocks sunlight only in January',
                      nextNodeId: 'season-myth',
                      feedback: 'Eclipses are rare brief shadows; compare July temperatures in Melbourne vs Chicago instead!',
                      outcome: 'suboptimal',
                    },
                  ],
                },
                daylight: {
                  promptMarkdown: 'At the June solstice (Northern Summer), what happens north of the Arctic Circle (~66.5°N)?',
                  choices: [
                    {
                      label: '24-hour continuous daylight (Midnight Sun) because the tilted north pole stays in the sunlit half all rotation',
                      nextNodeId: null,
                      feedback: 'Exact! Meanwhile Antarctica inside 66.5°S experiences 24-hour polar night.',
                      outcome: 'optimal',
                    },
                    {
                      label: '12 hours day and 12 hours night everywhere',
                      nextNodeId: null,
                      feedback: '12h/12h everywhere happens on the March and September Equinoxes, not the solstices!',
                      outcome: 'suboptimal',
                    },
                  ],
                },
              },
            },
            {
              id: 'earth-u1-l2-s4',
              kind: 'checkpoint',
              title: 'P-Wave vs S-Wave Arrival Order',
              question: {
                type: 'truefalse',
                prompt: 'Compressional P-waves always arrive at a distant seismograph station before transverse S-waves.',
                correct: true,
                explanation: 'Primary P-waves travel ~1.7× faster through crust and mantle than secondary shear S-waves.',
                points: 10,
              },
            },
            {
              id: 'earth-u1-l2-s5',
              kind: 'synthesis',
              title: 'Insolation & Axial Tilt Mastered',
              takeaways: [
                'Earth’s 23.4° axial tilt keeps constant orientation in space, shifting beam angle and day length inversely across hemispheres.',
                'On equinoxes, direct overhead sun hits the Equator and daylight lasts ~12 hours globally.',
              ],
              nextQuizIndex: 0,
              arcadeLaunch: { mode: 'knowledge-bastion', packId: 'earth-tectonic-systems' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'earth-u1-l2-fc1',
              front: 'Primary cause of Earth’s seasons',
              back: 'Earth’s 23.4° axial tilt (obliquity) keeps orientation fixed while orbiting, changing solar incidence angle and daylight duration.',
              explanation: 'Earth is actually closest to the Sun in early January (Northern winter).',
              interleave: true,
            },
            {
              id: 'earth-u1-l2-fc2',
              front: 'What latitudes sit at 23.4°N/S vs 66.6°N/S?',
              back: '23.4° (Tropics of Cancer/Capricorn): maximum poleward latitude for overhead noon sun; 66.6° (Arctic/Antarctic Circles): onset of 24-hr solstice day/night.',
              explanation: 'Notice 23.4° + 66.6° = 90°!',
              interleave: true,
            },
            {
              id: 'earth-u1-l2-fc3',
              front: 'Beer-Lambert / Cosine projection law for slanted sunlight intensity',
              back: 'Surface flux I = I₀ sin(solar altitude) = I₀ cos(zenith angle).',
              explanation: 'Lower sun spreads identical beam energy across larger horizontal surface area.',
              interleave: true,
            },
          ],
        },
        {
          id: 'earth-u1-l3',
          unitId: 'earth-u1',
          title: 'Landslide Slope Stability & Tectonic Vectors',
          summary:
            'Balance driving downslope gravity against normal-force friction on steep volcanic slopes.',
          estimatedMinutes: 8,
          standards: ['NGSS HS-ESS2-1', 'NGSS HS-PS2-1'],
          prerequisiteLessonIds: ['earth-u1-l1'],
          visual: {
            kind: 'figure-2d',
            figure: {
              template: 'inclined-plane',
              givens: { mass: 50, angle: 35, mu: 0.4 },
              ask: 'netForce',
              rounding: 'tenth',
              ranges: { mass: [20, 90], angle: [28, 55], mu: [0.15, 0.4] },
            },
          },
          steps: [
            {
              id: 'earth-u1-l3-s1',
              kind: 'narrative',
              title: 'Why Steeper Volcanoes Trigger Landslides',
              bodyMarkdown:
                'Every boulder perched on a volcanic cone feels two opposing pulls along the slope: **driving gravity** $F_{g\\parallel} = mg\\sin\\theta$ pulling downslope, versus **resisting friction** $f_k = \\mu mg\\cos\\theta$ holding it up.\n\nNotice something remarkable in the critical failure ratio: $mg\\sin\\theta > \\mu mg\\cos\\theta$ simplifies cleanly to **$\\tan\\theta > \\mu$**—mass $m$ cancels out completely!',
              callout: {
                tone: 'key-idea',
                text: 'Angle of repose satisfies tan(θ_max) = μ_s! Heavy rainwater pore pressure reduces normal friction and lowers failure angle.',
              },
            },
            {
              id: 'earth-u1-l3-s2',
              kind: 'predict-observe-explain',
              title: 'Predict Slope Net Force vs Angle',
              predictionPrompt:
                'As volcanic debris builds a steeper talus slope (θ rising toward 45°), why do landslides accelerate rapidly?',
              predictionChoices: [
                'Downslope pull mg sin θ rises while normal grip mg cos θ simultaneously drops!',
                'Gravity constant g doubles above 30°',
                'Normal force mg cos θ grows toward infinity',
                'Rock mass doubles with angle',
              ],
              correctPredictionIndex: 0,
              visual: {
                kind: 'figure-2d',
                figure: {
                  template: 'inclined-plane',
                  givens: { mass: 50, angle: 35, mu: 0.4 },
                  ask: 'netForce',
                  rounding: 'tenth',
                },
              },
              observeInstruction:
                'Inspect the driving parallel gravity arrow and opposing friction vector on the inclined volcanic slope diagram.',
              explainPrompt: 'What is the net downslope force F_net when mass = 50 kg, θ = 35°, and μ = 0.4?',
              explainOptions: [
                'mg(sin 35° − 0.4 cos 35°) ≈ 490(0.5736 − 0.3277) ≈ 120.5 N',
                'mg(cos 35° − 0.4 sin 35°) ≈ 289 N',
                '490 × 0.4 = 196 N',
                'Zero net force at 35°',
              ],
              correctExplainIndex: 0,
              reconcileFeedback:
                'Driving weight component 281.1 N exceeds kinetic friction 160.6 N, leaving ~120.5 N net downslope acceleration.',
            },
            {
              id: 'earth-u1-l3-s3',
              kind: 'worked-example',
              title: 'Computing Critical Angle of Repose From Friction',
              problemMarkdown: 'Dry basalt gravel has static friction $\\mu_s = 0.70$. At what slope angle does a talus cone begin sliding?',
              steps: [
                {
                  label: 'Set downslope force equal to max static friction',
                  expressionOrAction: 'mg sin θ = μ_s mg cos θ -> divide both sides by mg cos θ',
                  whyNote: 'Mass m and gravity g both cancel out cleanly!',
                },
                {
                  label: 'Solve tan θ = 0.70',
                  expressionOrAction: 'θ_crit = arctan(0.70) ≈ 35.0°.',
                  whyNote: 'Dry sand/gravel piles naturally stabilize right around 30°–35°.',
                },
              ],
            },
            {
              id: 'earth-u1-l3-s4',
              kind: 'checkpoint',
              title: 'Dynamic Slope Net Force Calculation',
              question: {
                type: 'figure',
                prompt: 'Find the net downslope force F_net (in N) acting on the sliding volcanic block shown (round to tenths).',
                figure: {
                  template: 'inclined-plane',
                  givens: { mass: 50, angle: 35, mu: 0.4 },
                  ask: 'netForce',
                  rounding: 'tenth',
                  ranges: { mass: [20, 90], angle: [28, 55], mu: [0.15, 0.4] },
                },
                explanation: 'Compute F_net = m · 9.8 · (sin θ − μ cos θ).',
                points: 15,
              },
            },
            {
              id: 'earth-u1-l3-s5',
              kind: 'synthesis',
              title: 'Earth Systems Track Complete',
              takeaways: [
                'Slope failure occurs when tan θ > μ (driving gravity beats normal-weighted friction).',
                'Combined 2D tectonic velocity vectors sum component-by-component to predict collision speeds.',
              ],
              nextQuizIndex: 2,
              arcadeLaunch: { mode: 'knowledge-bastion', packId: 'earth-tectonic-systems' },
              flashcardEnroll: { autoEnroll: true, interleave: true },
            },
          ],
          flashcardSeeds: [
            {
              id: 'earth-u1-l3-fc1',
              front: 'Critical angle of repose relation between slope angle θ and static friction μ_s',
              back: 'tan(θ_crit) = μ_s (derived from mg sin θ = μ_s mg cos θ).',
              explanation: 'Independent of rock mass m and local gravity g!',
              interleave: true,
            },
            {
              id: 'earth-u1-l3-fc2',
              front: 'Why does heavy rainfall trigger landslides on previously stable slopes?',
              back: 'Water pore pressure supports part of the weight, reducing effective normal stress F_N and frictional shear resistance.',
              explanation: 'Adding water also raises bulk weight on the slope.',
              interleave: true,
            },
            {
              id: 'earth-u1-l3-fc3',
              front: 'Net downslope force F_net on a sliding block (θ, m, μ_k)',
              back: 'F_net = mg(sin θ − μ_k cos θ).',
              explanation: 'Gravity parallel component minus kinetic friction opposing motion.',
              interleave: true,
            },
          ],
        },
      ],
    },
  ],
}

export const STEM_SCIENCE_PACKS: ContentPack[] = [
  // 5. PHYSICS (retains canonical id 'astrophysics-orbital-mechanics' referenced by Kepler & Match)
  {
    id: 'astrophysics-orbital-mechanics',
    name: 'Physics: Mechanics, EM Fields & Optics',
    description:
      'Newtonian inclined planes, Keplerian orbits, DC circuits, Lorentz cyclotron motion, and Young’s double-slit interference.',
    subject: 'Physics',
    category: 'Science',
    icon: '⚛️',
    modelId: 'lorentz-force',
    relatedModelIds: ['kepler', 'wave-optics', 'carnot-cycle', 'dc-rc-circuits-2d', 'seasons-axial-tilt-3d'],
    standards: 'AP Physics 1 & 2 · AP Physics C · NGSS HS-PS2 / HS-PS4',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: ['algebra-linear-systems'],
    track: PHYS_TRACK,
    units: PHYS_TRACK.units,
    quizzes: [
      {
        title: 'Forces, Ramps & Orbital Motion',
        description: 'Free-body diagrams on inclined planes, vectors, and Kepler’s laws.',
        subject: 'Physics',
        difficulty: 'easy',
        timeLimitSec: 540,
        srsInterleave: true,
        lessonId: 'phys-u1-l1',
        modelId: 'kepler',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the normal force F_N (in N) acting on the block. Round to the nearest tenth.',
            figure: {
              template: 'inclined-plane',
              givens: { mass: 10, angle: 30, mu: 0.2 },
              ask: 'normalForce',
              rounding: 'tenth',
              ranges: { mass: [5, 25], angle: [15, 50], mu: [0.1, 0.35] },
            },
            points: 10,
            explanation: 'Normal force balances perpendicular weight: F_N = m · 9.8 · cos(θ).',
          },
          {
            type: 'figure',
            prompt: 'Find the resultant magnitude |u + v| of the two force vectors.',
            figure: {
              template: 'vector-2d',
              givens: { ux: 6, uy: 0, vx: 0, vy: 8 },
              ask: 'resultantMag',
              rounding: 'integer',
              ranges: { ux: [-12, 12], uy: [-12, 12], vx: [-12, 12], vy: [-12, 12] },
            },
            points: 10,
            explanation: 'Add components first, then take norm: |u + v| = √((ux + vx)² + (uy + vy)²).',
          },
          {
            type: 'mcq',
            prompt: 'According to Kepler’s Second Law, a planet in an elliptical orbit moves fastest at:',
            options: ['Aphelion (farthest point)', 'Perihelion (closest point)', 'The semi-minor axis', 'Constant speed everywhere'],
            correct: 1,
            points: 10,
            explanation: 'Conservation of angular momentum L = mrv⊥ forces higher speed at smaller orbital radius (perihelion).',
          },
          {
            type: 'truefalse',
            prompt: 'Doubling the distance between two masses reduces their gravitational attraction by a factor of 4.',
            correct: true,
            points: 10,
            explanation: 'Newton’s inverse-square law F = Gm₁m₂/r² divides force by 2² = 4.',
          },
        ],
      },
      {
        title: 'DC Circuits & Electromagnetism',
        description: 'Series-parallel resistor networks, Ohm’s law, and Lorentz magnetic forces.',
        subject: 'Physics',
        difficulty: 'medium',
        timeLimitSec: 600,
        srsInterleave: true,
        lessonId: 'phys-u1-l2',
        modelId: 'dc-rc-circuits-2d',
        questions: [
          {
            type: 'figure',
            prompt: 'Find the total equivalent resistance R_eq (in Ω) of this series-parallel circuit (round to the nearest tenth).',
            figure: {
              template: 'series-parallel-circuit',
              givens: { voltage: 24, r1: 4, r2: 6, r3: 12 },
              ask: 'equivR',
              rounding: 'tenth',
              ranges: { voltage: [12, 48], r1: [2, 10], r2: [4, 24], r3: [4, 24] },
            },
            points: 10,
            explanation: 'Combine parallel R_parallel = (R₂·R₃)/(R₂ + R₃), then add series R₁.',
          },
          {
            type: 'figure',
            prompt: 'Find the total current I_tot (in A) drawn from the labeled battery (round to the nearest tenth).',
            figure: {
              template: 'series-parallel-circuit',
              givens: { voltage: 24, r1: 4, r2: 6, r3: 12 },
              ask: 'totalCurrent',
              rounding: 'tenth',
              ranges: { voltage: [12, 48], r1: [2, 10], r2: [4, 24], r3: [4, 24] },
            },
            points: 10,
            explanation: 'Find R_eq = R₁ + (R₂·R₃)/(R₂ + R₃), then divide source voltage V by R_eq.',
          },
          {
            type: 'mcq',
            prompt: 'Why does a static magnetic field B never change the kinetic energy of a charged particle?',
            options: [
              'Magnetic fields only act on neutral particles',
              'The magnetic force q(v × B) is always perpendicular to velocity v, so work W = 0',
              'Magnetic force cancels electric force everywhere',
              'Relativistic mass absorbs the energy',
            ],
            correct: 1,
            points: 10,
            explanation: 'Instantaneous power P = F · v = q(v × B) · v = 0 because v × B ⊥ v.',
          },
          {
            type: 'fill',
            prompt: 'In uniform circular cyclotron motion, the radius r = mv / (|q|B) is called the ______ radius.',
            correct: 'Larmor',
            alternatives: ['cyclotron', 'gyroradius'],
            points: 10,
            explanation: 'Setting qvB = mv²/r yields the Larmor (or cyclotron) radius r = mv/(|q|B).',
          },
        ],
      },
      {
        title: 'Wave Optics & Acceleration Dynamics',
        description: 'Double-slit diffraction fringes and kinetic friction dynamics.',
        subject: 'Physics',
        difficulty: 'hard',
        timeLimitSec: 720,
        srsInterleave: true,
        lessonId: 'phys-u1-l3',
        modelId: 'wave-optics',
        questions: [
          {
            type: 'figure',
            prompt: 'Calculate the downslope acceleration a (in m/s²) of the block. Round to the nearest hundredth.',
            figure: {
              template: 'inclined-plane',
              givens: { mass: 5, angle: 30, mu: 0.25 },
              ask: 'acceleration',
              rounding: 'hundredth',
              ranges: { mass: [4, 20], angle: [28, 55], mu: [0.1, 0.3] },
            },
            points: 15,
            explanation: 'Downslope acceleration equals a = g(sin θ − μ cos θ), independent of mass m.',
          },
          {
            type: 'mcq',
            prompt: 'In Young’s double-slit experiment (Δy = λL / d), what happens to fringe spacing if slit separation d is doubled?',
            options: ['Fringes spread twice as far apart', 'Fringe spacing is cut in half', 'Fringe spacing quadruples', 'Central maximum disappears'],
            correct: 1,
            points: 15,
            explanation: 'Δy = λL / d is inversely proportional to slit separation d.',
          },
          {
            type: 'figure',
            prompt: 'Find the current I₂ (in A) flowing specifically through the top R₂ branch (round to the nearest tenth).',
            figure: {
              template: 'series-parallel-circuit',
              givens: { voltage: 24, r1: 4, r2: 6, r3: 12 },
              ask: 'branchCurrent2',
              rounding: 'tenth',
              ranges: { voltage: [12, 48], r1: [2, 10], r2: [4, 24], r3: [4, 24] },
            },
            points: 15,
            explanation: 'Find total current I_tot = V / R_eq, compute parallel node drop V_p = I_tot · R_p (or V − I_tot · R₁), then I₂ = V_p / R₂.',
          },
          {
            type: 'order',
            prompt: 'Order visible light colors from shortest wavelength (highest photon energy) to longest wavelength:',
            options: ['Violet (~400 nm)', 'Blue (~470 nm)', 'Green (~530 nm)', 'Red (~680 nm)'],
            correct: [0, 1, 2, 3],
            points: 15,
            explanation: 'Photon energy E = hc/λ decreases as wavelength increases from violet (400 nm) to red (700 nm).',
          },
        ],
      },
    ],
  },

  // 6. CHEMISTRY (retains canonical id 'chemical-bonding-vsepr')
  {
    id: 'chemical-bonding-vsepr',
    name: 'Chemistry: Bonding, Stoichiometry & Thermo',
    description:
      'VSEPR 3D molecular geometry, lone-pair repulsion, limiting reactants, Carnot thermodynamics, and chemical equilibrium.',
    subject: 'Chemistry',
    category: 'Science',
    icon: '⚗️',
    modelId: 'vsepr',
    relatedModelIds: ['carnot-cycle', 'acid-base-titration-2d'],
    standards: 'AP Chemistry Units 2, 4, 6 & 9 · NGSS HS-PS1',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: ['algebra-linear-systems'],
    track: CHEM_TRACK,
    units: CHEM_TRACK.units,
    quizzes: [
      {
        title: 'VSEPR Shapes & Bond Polarity',
        description: 'Predict molecular geometries and bond angles from electron domains.',
        subject: 'Chemistry',
        difficulty: 'easy',
        timeLimitSec: 480,
        srsInterleave: true,
        lessonId: 'chem-u1-l1',
        modelId: 'vsepr',
        questions: [
          {
            type: 'mcq',
            prompt: 'What is the ideal H–C–H bond angle in methane (CH₄, 4 bonding pairs, 0 lone pairs)?',
            options: ['90°', '104.5°', '109.5°', '120°'],
            correct: 2,
            points: 10,
            explanation: 'Four symmetric sp³ bonding domains form a regular tetrahedron with 109.5° angles.',
          },
          {
            type: 'mcq',
            prompt: 'Why is water’s bond angle (104.5°) smaller than ammonia’s (107°)?',
            options: [
              'Oxygen has fewer protons than nitrogen',
              'Water has two lone pairs on oxygen exerting stronger repulsion than ammonia’s single lone pair',
              'Hydrogen bonds stretch the O–H covalent bond',
              'Water is sp² hybridized',
            ],
            correct: 1,
            points: 10,
            explanation: 'Lone-pair–lone-pair repulsion > lone-pair–bonding-pair > bonding-pair–bonding-pair.',
          },
          {
            type: 'truefalse',
            prompt: 'Carbon dioxide (O=C=O) contains polar bonds yet is a nonpolar molecule overall.',
            correct: true,
            points: 10,
            explanation: 'Its 180° linear geometry causes the two equal C=O bond dipoles to cancel out completely.',
          },
          {
            type: 'fill',
            prompt: 'A central atom with 3 bonding pairs and 0 lone pairs (such as BF₃) adopts a trigonal ______ geometry.',
            correct: 'planar',
            alternatives: [],
            points: 10,
            explanation: 'Three electron domains space out at 120° in a flat trigonal planar arrangement.',
          },
        ],
      },
      {
        title: 'Stoichiometry & Ideal Gases',
        description: 'Mole ratios, limiting reagents, and kinetic molecular gas behavior.',
        subject: 'Chemistry',
        difficulty: 'medium',
        timeLimitSec: 600,
        modelId: 'carnot-cycle',
        questions: [
          {
            type: 'mcq',
            prompt: 'In N₂ + 3H₂ → 2NH₃, reacting 3.0 mol N₂ with 6.0 mol H₂ yields at most how many moles of NH₃?',
            options: ['2.0 mol', '4.0 mol', '6.0 mol', '9.0 mol'],
            correct: 1,
            points: 10,
            explanation: 'H₂ is limiting (6.0 mol H₂ × 2 mol NH₃ / 3 mol H₂ = 4.0 mol NH₃; only 2.0 mol N₂ is consumed).',
          },
          {
            type: 'fill',
            prompt: 'At STP (0 °C and 1 atm), 1.0 mole of an ideal gas occupies approximately 22.4 ______.',
            correct: 'liters',
            alternatives: ['L', 'litres', 'dm3'],
            points: 10,
            explanation: 'V = nRT/P = (1)(0.08206)(273.15)/1 ≈ 22.41 L.',
          },
          {
            type: 'order',
            prompt: 'Order the steps to convert grams of reactant A to grams of product B:',
            options: [
              'Balance the chemical equation to establish stoichiometric coefficients',
              'Divide mass of A by molar mass of A to get moles of A',
              'Multiply by the mole ratio (coeff B / coeff A) to get moles of B',
              'Multiply moles of B by molar mass of B to obtain grams of B',
            ],
            correct: [0, 1, 2, 3],
            points: 10,
            explanation: 'Grams A → Moles A → Moles B → Grams B.',
          },
          {
            type: 'truefalse',
            prompt: 'At the same Kelvin temperature, helium (M = 4 g/mol) has a higher root-mean-square speed than argon (M = 40 g/mol).',
            correct: true,
            points: 10,
            explanation: 'v_rms = √(3RT/M); lighter gas molecules move faster at equal average kinetic energy.',
          },
        ],
      },
      {
        title: 'Thermodynamics & Carnot Engines',
        description: 'Gibbs free energy, Carnot thermal efficiency, and adiabatic expansion.',
        subject: 'Chemistry',
        difficulty: 'hard',
        timeLimitSec: 720,
        modelId: 'carnot-cycle',
        questions: [
          {
            type: 'mcq',
            prompt: 'A reversible Carnot engine operates between T_H = 600 K and T_C = 150 K. Its maximum efficiency η is:',
            options: ['25%', '50%', '75%', '80%'],
            correct: 2,
            points: 15,
            explanation: 'η = 1 − T_C / T_H = 1 − 150 / 600 = 0.75 (75%).',
          },
          {
            type: 'mcq',
            prompt: 'A reaction with ΔH < 0 (exothermic) and ΔS > 0 (entropy increases) is thermodynamically favorable (ΔG < 0):',
            options: ['At all temperatures', 'Only at high temperatures', 'Only at low temperatures', 'At no temperature'],
            correct: 0,
            points: 15,
            explanation: 'ΔG = ΔH − TΔS is strictly negative for all T > 0 when ΔH < 0 and ΔS > 0.',
          },
          {
            type: 'order',
            prompt: 'Order the four stages of a Carnot heat engine cycle starting from minimum volume at T_H:',
            options: [
              'Isothermal expansion at T_H (absorbing heat Q_H)',
              'Adiabatic expansion (cooling gas from T_H to T_C with Q = 0)',
              'Isothermal compression at T_C (rejecting heat Q_C)',
              'Adiabatic compression (warming gas from T_C back to T_H)',
            ],
            correct: [0, 1, 2, 3],
            points: 15,
            explanation: 'Two isothermals interleaved with two adiabats form the closed Carnot P–V loop.',
          },
          {
            type: 'fill',
            prompt: 'In an adiabatic expansion (Q = 0), internal energy ΔU equals −W, so the gas temperature ______.',
            correct: 'decreases',
            alternatives: ['drops', 'falls', 'cools'],
            points: 15,
            explanation: 'Because the gas does positive work W > 0 without heat input, ΔU < 0 and temperature drops.',
          },
        ],
      },
    ],
  },

  // 7. BIOLOGY (retains canonical id 'cellular-molecular-biology')
  {
    id: 'cellular-molecular-biology',
    name: 'Biology: Cells, Genetics & Neurobiology',
    description:
      'Eukaryotic organelles, DNA replication forks & Okazaki fragments, synaptic neurotransmission, and cellular energetics.',
    subject: 'Biology',
    category: 'Science',
    icon: '🧬',
    modelId: 'dna-fork',
    relatedModelIds: ['cell', 'synapse-neuro', 'hardy-weinberg-selection-2d'],
    standards: 'AP Biology Units 2, 3, 6 · NGSS HS-LS1 / HS-LS3',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: [],
    track: BIO_TRACK,
    units: BIO_TRACK.units,
    quizzes: [
      {
        title: 'Eukaryotic Organelle Architecture',
        description: 'Compartmentalization, protein trafficking, and cellular energy conversion.',
        subject: 'Biology',
        difficulty: 'easy',
        timeLimitSec: 480,
        srsInterleave: true,
        lessonId: 'bio-u1-l1',
        modelId: 'cell',
        questions: [
          {
            type: 'mcq',
            prompt: 'Why is the inner mitochondrial membrane heavily folded into cristae?',
            options: [
              'To store extra genomic DNA',
              'To maximize surface area for electron transport chains and ATP synthase',
              'To block oxygen from entering the matrix',
              'To digest worn-out lysosomes',
            ],
            correct: 1,
            points: 10,
            explanation: 'Cristae dramatically expand membrane area for oxidative phosphorylation.',
          },
          {
            type: 'order',
            prompt: 'Trace a secreted protein through the endomembrane pathway from synthesis to export:',
            options: [
              'Bound ribosome on the Rough ER translates the polypeptide',
              'Transport vesicle buds from Rough ER to the cis-Golgi',
              'Golgi apparatus modifies and sorts the glycoprotein',
              'Secretory vesicle fuses with the plasma membrane via exocytosis',
            ],
            correct: [0, 1, 2, 3],
            points: 10,
            explanation: 'Rough ER → transport vesicle → Golgi stack → plasma membrane exocytosis.',
          },
          {
            type: 'truefalse',
            prompt: 'Lysosomes maintain an acidic interior (~pH 4.8) so hydrolytic enzymes stay inactive if leaked into neutral cytosol.',
            correct: true,
            points: 10,
            explanation: 'Proton pumps acidify the lysosome lumen, providing built-in compartmental safety.',
          },
          {
            type: 'fill',
            prompt: 'Ribosomal subunits are assembled inside a dense nuclear subregion called the ______.',
            correct: 'nucleolus',
            alternatives: [],
            points: 10,
            explanation: 'rRNA transcription and ribosomal subunit assembly occur in the nucleolus.',
          },
        ],
      },
      {
        title: 'DNA Replication Fork Mechanics',
        description: 'Helicase unwinding, antiparallel synthesis, leading vs. lagging strands.',
        subject: 'Biology',
        difficulty: 'medium',
        timeLimitSec: 600,
        modelId: 'dna-fork',
        questions: [
          {
            type: 'mcq',
            prompt: 'Why must the lagging strand be synthesized discontinuously as Okazaki fragments?',
            options: [
              'Helicase unwinds only one strand at a time',
              'DNA polymerase can only add nucleotides to a free 3′–OH end (5′ → 3′ synthesis) on antiparallel templates',
              'Adenine pairs faster than guanine',
              'RNA primase blocks continuous synthesis on both strands',
            ],
            correct: 1,
            points: 10,
            explanation: 'Antiparallel strands + strict 5′ → 3′ polymerase directionality force back-stitching away from the fork.',
          },
          {
            type: 'mcq',
            prompt: 'How many hydrogen bonds stabilize a Guanine–Cytosine (G≡C) base pair compared to Adenine–Thymine (A=T)?',
            options: ['2 in G–C vs 3 in A–T', '3 in G–C vs 2 in A–T', '1 in both', '4 in G–C vs 2 in A–T'],
            correct: 1,
            points: 10,
            explanation: 'G≡C forms 3 hydrogen bonds (higher melting temperature), while A=T forms 2.',
          },
          {
            type: 'order',
            prompt: 'Order the enzymatic actions at a DNA replication fork:',
            options: [
              'Helicase unwinds the parental double helix and breaks hydrogen bonds',
              'Primase synthesizes a short RNA primer with a free 3′–OH group',
              'DNA Polymerase III extends the new DNA strand in the 5′ → 3′ direction',
              'DNA Ligase seals phosphodiester nicks between adjacent Okazaki fragments',
            ],
            correct: [0, 1, 2, 3],
            points: 10,
            explanation: 'Helicase unwinds → Primase primes → DNA Pol III extends → DNA Pol I replaces RNA & Ligase seals.',
          },
          {
            type: 'fill',
            prompt: 'Ahead of the replication fork, the enzyme ______ relieves supercoiling tension by cutting and rejoining DNA.',
            correct: 'topoisomerase',
            alternatives: ['dna gyrase', 'gyrase'],
            points: 10,
            explanation: 'Topoisomerase prevents torsional overwinding ahead of helicase.',
          },
        ],
      },
      {
        title: 'Synaptic Transmission & Action Potentials',
        description: 'Calcium-triggered exocytosis, ligand-gated ion channels, and reuptake.',
        subject: 'Biology',
        difficulty: 'hard',
        timeLimitSec: 720,
        modelId: 'synapse-neuro',
        questions: [
          {
            type: 'order',
            prompt: 'Sequence chemical transmission across a cholinergic or glutamatergic synapse:',
            options: [
              'Action potential depolarizes the pre-synaptic axon terminal',
              'Voltage-gated Ca²⁺ channels open and calcium ions rush into the terminal',
              'Synaptic vesicles fuse with the pre-synaptic membrane (exocytosis)',
              'Neurotransmitters diffuse across the cleft and open post-synaptic ligand-gated ion channels',
            ],
            correct: [0, 1, 2, 3],
            points: 15,
            explanation: 'Depolarization → Ca²⁺ influx → SNARE-mediated vesicle fusion → post-synaptic receptor binding.',
          },
          {
            type: 'mcq',
            prompt: 'Selective serotonin reuptake inhibitors (SSRIs) increase synaptic signaling primarily by:',
            options: [
              'Blocking pre-synaptic reuptake transporters so neurotransmitter remains in the cleft longer',
              'Destroying post-synaptic receptors',
              'Preventing Ca²⁺ from entering the axon terminal',
              'Converting electrical synapses into myelin sheaths',
            ],
            correct: 0,
            points: 15,
            explanation: 'Inhibiting pre-synaptic transporter reuptake prolongs neurotransmitter dwell time in the cleft.',
          },
          {
            type: 'truefalse',
            prompt: 'Opening post-synaptic Cl⁻ (chloride) channels typically hyperpolarizes the dendrite, producing an IPSP.',
            correct: true,
            points: 15,
            explanation: 'Influx of negatively charged Cl⁻ drives membrane potential further from threshold (inhibitory).',
          },
          {
            type: 'fill',
            prompt: 'The narrow ~20 nm extracellular gap separating pre- and post-synaptic neurons is the synaptic ______.',
            correct: 'cleft',
            alternatives: ['gap'],
            points: 15,
            explanation: 'Neurotransmitters diffuse across the ~20–40 nm synaptic cleft.',
          },
        ],
      },
    ],
  },

  // 8. EARTH SCIENCE
  {
    id: 'earth-tectonic-systems',
    name: 'Earth Science: Plate Tectonics & Geodynamics',
    description:
      'Subduction trenches, Wadati–Benioff seismic zones, mantle convection plumes, volcanic arcs, and plate kinematics.',
    subject: 'Earth Science',
    category: 'Science',
    icon: '🌋',
    modelId: 'plate-tectonics',
    relatedModelIds: ['seasons-axial-tilt-3d'],
    standards: 'NGSS HS-ESS1-5 · HS-ESS2-1 · HS-ESS2-3',
    license: 'MIT',
    sourceAttribution: 'OpenPath Original Authors (MIT)',
    srsInterleave: true,
    gradeBand: 'HS',
    prerequisitePackIds: [],
    track: EARTH_TRACK,
    units: EARTH_TRACK.units,
    quizzes: [
      {
        title: 'Crustal Layers & Plate Boundaries',
        description: 'Oceanic vs. continental crust density, trenches, and mid-ocean ridges.',
        subject: 'Earth Science',
        difficulty: 'easy',
        timeLimitSec: 480,
        srsInterleave: true,
        lessonId: 'earth-u1-l1',
        modelId: 'plate-tectonics',
        questions: [
          {
            type: 'mcq',
            prompt: 'When an oceanic plate collides with a continental plate, why does the oceanic plate subduct?',
            options: [
              'Oceanic crust is thicker than continental crust',
              'Basaltic oceanic crust (~3.0 g/cm³) is denser than granitic continental crust (~2.7 g/cm³)',
              'Continental crust is younger than oceanic crust',
              'Ocean water pushes the continental crust upward',
            ],
            correct: 1,
            points: 10,
            explanation: 'Mafic basalt/gabbro oceanic lithosphere is denser and sinks into the asthenosphere.',
          },
          {
            type: 'truefalse',
            prompt: 'Oceanic crust gets progressively older and colder with increasing distance from a mid-ocean ridge.',
            correct: true,
            points: 10,
            explanation: 'Seafloor spreading forms new basalt at the ridge crest and conveys older crust outward.',
          },
          {
            type: 'fill',
            prompt: 'Thermal ______ currents in the plastic mantle drive lithospheric plate motion.',
            correct: 'convection',
            alternatives: [],
            points: 10,
            explanation: 'Buoyant hot mantle plumes rise while cold dense subducted slabs pull plates downward.',
          },
          {
            type: 'mcq',
            prompt: 'The San Andreas Fault in California is a classic example of a:',
            options: ['Divergent boundary', 'Oceanic-continental subduction zone', 'Transform plate boundary', 'Hotspot caldera'],
            correct: 2,
            points: 10,
            explanation: 'The Pacific and North American plates slide horizontally past one another along a transform fault.',
          },
        ],
      },
      {
        title: 'Subduction Volcanism & Benioff Zones',
        description: 'Flux melting, volcanic arcs, and inclined earthquake depth profiles.',
        subject: 'Earth Science',
        difficulty: 'medium',
        timeLimitSec: 600,
        modelId: 'plate-tectonics',
        questions: [
          {
            type: 'mcq',
            prompt: 'What triggers magma generation in the mantle wedge above a subducting oceanic slab?',
            options: [
              'Frictional surface melting at 5 km depth',
              'Volatiles (water) released from hydrous minerals lower the solidus melting temperature of mantle peridotite',
              'Solar radiation heating the trench',
              'Core iron rising directly into the crust',
            ],
            correct: 1,
            points: 10,
            explanation: 'Flux melting: water driven off the subducting slab lowers the melting point of overlying asthenosphere.',
          },
          {
            type: 'order',
            prompt: 'Order these subduction features as you travel landward from the open ocean onto the overriding continent:',
            options: [
              'Abyssal plain on the approaching oceanic plate',
              'Deep-sea oceanic trench',
              'Forearc accretionary wedge',
              'Continental volcanic arc (stratovolcano chain)',
            ],
            correct: [0, 1, 2, 3],
            points: 10,
            explanation: 'Ocean basin → trench → scraped accretionary prism → volcanic arc ~100 km above the slab.',
          },
          {
            type: 'figure',
            prompt: 'Two tectonic velocity vectors u (mm/yr east/north) and v combine across a triple junction. Find |u + v|.',
            figure: {
              template: 'vector-2d',
              givens: { ux: 30, uy: 10, vx: -6, vy: -17 },
              ask: 'resultantMag',
              rounding: 'integer',
              ranges: { ux: [-25, 25], uy: [-25, 25], vx: [-25, 25], vy: [-25, 25] },
            },
            points: 10,
            explanation: 'Sum components (ux + vx, uy + vy), then compute speed √(rx² + ry²).',
          },
          {
            type: 'fill',
            prompt: 'The inclined planar zone of shallow-to-deep earthquakes tracing a subducting slab is the Wadati–______ zone.',
            correct: 'Benioff',
            alternatives: ['benioff'],
            points: 10,
            explanation: 'Wadati–Benioff zones track seismic hypocenters down to ~670 km depth along the slab.',
          },
        ],
      },
      {
        title: 'Seismology & Slope Stability Mechanics',
        description: 'Seismic wave propagation, moment magnitude, and landslide mechanics.',
        subject: 'Earth Science',
        difficulty: 'hard',
        timeLimitSec: 720,
        srsInterleave: true,
        lessonId: 'earth-u1-l3',
        modelId: 'plate-tectonics',
        questions: [
          {
            type: 'figure',
            prompt: 'A boulder rests on the labeled volcanic slope (mass m, angle θ, kinetic friction μ). Find the net downslope force F_net (N) to the nearest tenth.',
            figure: {
              template: 'inclined-plane',
              givens: { mass: 50, angle: 35, mu: 0.4 },
              ask: 'netForce',
              rounding: 'tenth',
              ranges: { mass: [20, 90], angle: [28, 55], mu: [0.15, 0.4] },
            },
            points: 15,
            explanation: 'Net downslope force equals parallel gravity minus kinetic friction: F_net = m · 9.8 · (sin θ − μ cos θ).',
          },
          {
            type: 'mcq',
            prompt: 'How do seismologists prove Earth’s outer core is liquid?',
            options: [
              'P-waves accelerate dramatically in liquids',
              'Shear S-waves cannot propagate through liquids, creating an S-wave shadow zone beyond ~103°',
              'Surface Rayleigh waves bounce off the ionosphere',
              'Deep boreholes have sampled outer-core magma directly',
            ],
            correct: 1,
            points: 15,
            explanation: 'Liquids have zero shear modulus, blocking transverse S-waves completely across the outer core.',
          },
          {
            type: 'mcq',
            prompt: 'Each whole-number step (+1.0) on the Moment Magnitude (M_w) scale corresponds to roughly how much more released seismic energy?',
            options: ['2× energy', '10× energy', '~31.6× energy', '1000× energy'],
            correct: 2,
            points: 15,
            explanation: 'Amplitude scales by 10× per magnitude unit, while radiated energy scales by 10^1.5 ≈ 31.6×.',
          },
          {
            type: 'truefalse',
            prompt: 'Compressional P-waves always arrive at a distant seismograph station before S-waves.',
            correct: true,
            points: 15,
            explanation: 'Primary (P) longitudinal waves travel ~1.7× faster through rock than secondary (S) shear waves.',
          },
        ],
      },
    ],
  },
]
