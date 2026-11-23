import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { dailyPick } from '@shared/arcade'

/**
 * Three-free catalog of the 3D Lab. Importing this file never pulls in
 * three.js: each preset is a React.lazy() boundary, so the WebGL code
 * (and the `three-vendor` chunk) only loads when a model is opened.
 */
export interface LabModel {
  id: string
  title: string
  subject: string
  icon: string
  blurb: string
  /** Content pack whose quizzes reinforce this model. */
  packId: string
  standards: string
  /** Rendering engine ('3d' WebGL Three.js or '2d' lightweight Canvas/SVG). */
  renderer?: '2d' | '3d'
  Component: LazyExoticComponent<ComponentType>
}

export function getModelRenderer(model: Pick<LabModel, 'id' | 'renderer'>): '2d' | '3d' {
  return model.renderer ?? (model.id.endsWith('-2d') ? '2d' : '3d')
}

export const LAB_MODELS: LabModel[] = [
  {
    id: 'cell',
    title: 'Eukaryotic Cell',
    subject: 'Biology',
    icon: '🧫',
    blurb: 'Fade the membrane, stream the cytoplasm, and inspect every organelle.',
    packId: 'cellular-molecular-biology',
    standards: 'AP Bio Unit 2 · HS-LS1-2',
    Component: lazy(() => import('./presets/CellStructure3D')),
  },
  {
    id: 'dna-fork',
    title: 'DNA Replication Fork',
    subject: 'Biology',
    icon: '🧬',
    blurb: 'Unwind parental B-DNA with helicase to compare continuous leading vs. Okazaki lagging synthesis.',
    packId: 'cellular-molecular-biology',
    standards: 'AP Bio Unit 6 · HS-LS3-1',
    Component: lazy(() => import('./presets/DnaReplicationFork3D')),
  },
  {
    id: 'synapse-neuro',
    title: 'Synapse Transmission',
    subject: 'Neuroscience',
    icon: '⚡',
    blurb: 'Trigger Ca²⁺-mediated vesicle exocytosis, cleft diffusion, ion channel gating, and reuptake.',
    packId: 'cellular-molecular-biology',
    standards: 'AP Bio Unit 4 · IB Bio A2.2',
    Component: lazy(() => import('./presets/SynapseTransmission3D')),
  },
  {
    id: 'vsepr',
    title: 'VSEPR Geometry',
    subject: 'Chemistry',
    icon: '⚗️',
    blurb: 'Ball-and-stick or space-filling molecules with live bond-angle overlays.',
    packId: 'chemical-bonding-vsepr',
    standards: 'AP Chem Unit 2 · HS-PS1-3',
    Component: lazy(() => import('./presets/MolecularVSEPR3D')),
  },
  {
    id: 'carnot-cycle',
    title: 'Carnot Engine Cycle',
    subject: 'Thermodynamics',
    icon: '🔥',
    blurb: 'Run a 3D kinetic-gas piston between T_H and T_C synchronized with a live P–V indicator loop.',
    packId: 'chemical-bonding-vsepr',
    standards: 'AP Physics 2 Unit 2 · AP Chem Unit 9',
    Component: lazy(() => import('./presets/CarnotEngineCycle3D')),
  },
  {
    id: 'kepler',
    title: 'Kepler Orbits',
    subject: 'Astrophysics',
    icon: '🪐',
    blurb: 'A gravity sandbox with velocity vectors and equal-area sectors.',
    packId: 'astrophysics-orbital-mechanics',
    standards: 'AP Physics 1 Unit 3 · HS-ESS1-4',
    Component: lazy(() => import('./presets/KeplerOrbit3D')),
  },
  {
    id: 'lorentz-force',
    title: 'Lorentz Force & Cyclotron',
    subject: 'Physics',
    icon: '🧲',
    blurb: 'Send positive or negative charges into uniform B and E fields to trace F = q(E + v × B) helices.',
    packId: 'astrophysics-orbital-mechanics',
    standards: 'AP Physics 2 Unit 4 · AP Physics C: E&M',
    Component: lazy(() => import('./presets/LorentzForce3D')),
  },
  {
    id: 'wave-optics',
    title: 'Double-Slit Wave Optics',
    subject: 'Physics',
    icon: '🌈',
    blurb: 'Coherent dual-slit wavefronts rendering 3D interference fringes and live sinc²·cos² intensity curves.',
    packId: 'astrophysics-orbital-mechanics',
    standards: 'AP Physics 2 Unit 6 · HS-PS4-3',
    Component: lazy(() => import('./presets/DoubleSlitOptics3D')),
  },
  {
    id: 'plate-tectonics',
    title: 'Subduction & Plate Tectonics',
    subject: 'Earth Science',
    icon: '🌋',
    blurb: 'Oceanic subduction trench, animated mantle convection plumes, Benioff quakes, and volcanic arcs.',
    packId: 'earth-tectonic-systems',
    standards: 'NGSS HS-ESS2-1 · HS-ESS2-3',
    Component: lazy(() => import('./presets/PlateTectonics3D')),
  },
  {
    id: 'solids',
    title: 'Solids of Revolution',
    subject: 'Calculus',
    icon: '∭',
    blurb: 'Revolve curves into solids and slice them into disks and washers.',
    packId: 'multivariable-calculus-3d',
    standards: 'AP Calc AB/BC Unit 8',
    Component: lazy(() => import('./presets/SolidsOfRevolution3D')),
  },
  {
    id: 'geodesic-truss',
    title: 'Geodesic Dome Truss',
    subject: 'Engineering',
    icon: '🌐',
    blurb: 'Subdivide icosahedral domes (1V–4V) and visualize Hooke’s law compression vs. hoop tension.',
    packId: 'geometry-figures',
    standards: 'HSG-GMD · PLTW Civil Eng.',
    Component: lazy(() => import('./presets/GeodesicDomeTruss3D')),
  },
  {
    id: 'bst-3d',
    title: '3D Binary Search Tree',
    subject: 'Computer Science',
    icon: '🌲',
    blurb: 'Compare AVL self-balancing rotations against skewed BSTs with animated In-Order, Pre-Order & BFS rays.',
    packId: 'algorithms-data-structures',
    standards: 'AP CSA · IB CS HL D4',
    Component: lazy(() => import('./presets/BinarySearchTree3D')),
  },
  // ── Flagship 3D Earth & Space Expansion ──────────────────────
  {
    id: 'seasons-axial-tilt-3d',
    title: 'Seasons, Axial Tilt & Lunar Geometry',
    subject: 'Earth & Space',
    icon: 'Globe2',
    blurb:
      'Orbit Earth around the Sun with 23.5° tilt, exaggerated perihelion distance, noon beam spread, and Moon phases outside Earth’s umbra.',
    packId: 'earth-space-astronomy',
    standards: 'NGSS MS-ESS1-1 · HS-ESS1-4',
    renderer: '3d',
    Component: lazy(() => import('./presets/SeasonsAxialTilt3D')),
  },
  // ── 14 Interactive 2D Simulations (Zero-Three Lightweight) ───
  {
    id: 'compound-growth-npv-2d',
    title: 'Compound Growth, Inflation & NPV',
    subject: 'Finance & Economics',
    icon: 'TrendingUp',
    blurb:
      'Contrast exponential compounding and the Rule of 72 against linear saving, inflation drag, and discounted Net Present Value.',
    packId: 'finance-investing',
    standards: 'CEE Earning/Saving · AP Macro/CorpFin',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/CompoundGrowthNpv2D')),
  },
  {
    id: 'elasticity-price-controls-2d',
    title: 'Supply, Demand, Elasticity & Deadweight Loss',
    subject: 'Finance & Economics',
    icon: 'Scale',
    blurb:
      'Test price ceilings, floors, and per-unit taxes across varying curve elasticities while tracking CS, PS, DWL, and tax incidence.',
    packId: 'ap-microeconomics',
    standards: 'AP Microeconomics Unit 2',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/ElasticityPriceControls2D')),
  },
  {
    id: 'clt-sampling-inference-2d',
    title: 'Central Limit Theorem & Standard Error',
    subject: 'Statistics & Data',
    icon: 'BarChart3',
    blurb:
      'Draw live samples from skewed, bimodal, uniform, or normal populations and observe convergence to N(μ, σ/√n).',
    packId: 'ap-statistics',
    standards: 'AP Statistics Unit 5 · CCSS HSS-IC',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/CltSamplingInference2D')),
  },
  {
    id: 'bayes-natural-frequency-2d',
    title: 'Bayesian Reasoning & Natural Frequencies',
    subject: 'Statistics & Data',
    icon: 'Percent',
    blurb:
      'Translate conditional sensitivity and false-positive rates into a 1,000-person icon array to defeat the base-rate fallacy.',
    packId: 'data-probability',
    standards: 'CCSS HSS-CP · AP Statistics Unit 4',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/BayesNaturalFrequency2D')),
  },
  {
    id: 'derivative-integral-ftc-2d',
    title: 'Derivative, Secant Limit & Fundamental Theorem',
    subject: 'Calculus & Math',
    icon: 'Sigma',
    blurb:
      'Synchronized plots of f(x), tangent vs secant slope f′(x), and signed Riemann area A(x) = ∫ₐˣ f(t) dt.',
    packId: 'ap-calculus',
    standards: 'AP Calculus AB/BC Units 2, 6',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/DerivativeIntegralFtc2D')),
  },
  {
    id: 'linear-transform-eigen-2d',
    title: 'Linear Transformations, Determinant & Eigenvectors',
    subject: 'Calculus & Math',
    icon: 'MoveDiagonal',
    blurb:
      'Drag basis images Aî, Aĵ, and test vector v directly on the plane to see grid warping, signed area det(A), and eigenlines.',
    packId: 'linear-algebra',
    standards: 'Linear Algebra · Matrix Geometry',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/LinearTransformEigen2D')),
  },
  {
    id: 'unit-circle-wave-2d',
    title: 'Unit Circle & Unwrapped Sine/Cosine Waves',
    subject: 'Calculus & Math',
    icon: 'Compass',
    blurb:
      'Drag an angle around the unit circle and watch its signed vertical height and horizontal projection unwrap into waves.',
    packId: 'precalculus-trig',
    standards: 'CCSS HSF-TF.A/B · Precalculus',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/UnitCircleWave2D')),
  },
  {
    id: 'quantitative-ratio-balance-2d',
    title: 'Proportional Double Number Line & Equation Balance',
    subject: 'Calculus & Math',
    icon: 'Equal',
    blurb:
      'Contrast multiplicative ratio scaling against naive addition and level two-step equations ax + b = c on a physical balance.',
    packId: 'pre-algebra-ratios',
    standards: 'CCSS 6.RP · 7.EE.B · Algebra I',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/QuantitativeRatioBalance2D')),
  },
  {
    id: 'dc-rc-circuits-2d',
    title: 'DC Circuits & RC Transient Simulator',
    subject: 'Physics',
    icon: 'Zap',
    blurb:
      'Inspect series current conservation, parallel equivalent resistance drops, and exponential RC charging time constant τ = RC.',
    packId: 'ap-physics-em',
    standards: 'NGSS HS-PS3-5 · AP Physics 2 / C-E&M',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/DcRcCircuits2D')),
  },
  {
    id: 'acid-base-titration-2d',
    title: 'Acid-Base Titration, Buffers & Equivalence pH',
    subject: 'Chemistry',
    icon: 'FlaskConical',
    blurb:
      'Titrate strong or weak acids with NaOH while tracking exact pH, half-equivalence buffering (pH = pKa), and indicators.',
    packId: 'ap-chemistry',
    standards: 'AP Chemistry Unit 8 · NGSS HS-PS1-6',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/AcidBaseTitration2D')),
  },
  {
    id: 'hardy-weinberg-selection-2d',
    title: 'Hardy-Weinberg Equilibrium, Selection & Drift',
    subject: 'Biology',
    icon: 'Dna',
    blurb:
      'Explore Punnett-square genotype proportions, carrier sheltering of lethal recessives, heterozygote advantage, and drift.',
    packId: 'ap-biology',
    standards: 'AP Biology Unit 7 · NGSS HS-LS4-3',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/HardyWeinbergSelection2D')),
  },
  {
    id: 'graph-pathfinding-2d',
    title: 'Graph Search: BFS, Dijkstra, A* & Prim MST',
    subject: 'Computer Science',
    icon: 'GitFork',
    blurb:
      'Step through frontier queues and edge relaxation to see unweighted hop traps, weighted optimal paths, heuristics, and MSTs.',
    packId: 'algorithms-cs',
    standards: 'CS2 Algorithms · AP CS / Data Structures',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/GraphPathfinding2D')),
  },
  {
    id: 'sorting-recursion-stack-2d',
    title: 'Sorting Algorithms & Recursion Call Stack',
    subject: 'Computer Science',
    icon: 'Layers',
    blurb:
      'Compare Insertion, Merge, and Quicksort across input orders (N = 8..128) with live call-stack frames and comparison counters.',
    packId: 'algorithms-cs',
    standards: 'CS1/CS2 Sorting & Complexity',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/SortingRecursionStack2D')),
  },
  {
    id: 'fsrs-memory-decay-2d',
    title: 'FSRS Spaced Repetition & Memory Stability',
    subject: 'Learning Science',
    icon: 'Brain',
    blurb:
      'Visualize power-law forgetting curves, desirable-difficulty review triggers, and why spaced retrieval crushes cramming.',
    packId: 'cognitive-study-skills',
    standards: 'Metacognition & Retrieval Practice',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/FsrsMemoryDecay2D')),
  },
  {
    id: 'projectile-motion-2d',
    title: 'Projectile Motion: Range, Apex & Components',
    subject: 'Physics',
    icon: '🎯',
    blurb:
      'Aim a launcher on Earth, the Moon, Mars or Jupiter and see constant horizontal velocity and falling vertical velocity trace a parabola.',
    packId: 'physics-foundations',
    standards: 'AP Physics 1 Unit 1 (Kinematics)',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/ProjectileMotion2D')),
  },
  {
    id: 'greenhouse-effect-2d',
    title: 'Greenhouse Effect: Planetary Energy Balance',
    subject: 'Environmental Science',
    icon: '🌍',
    blurb:
      'Change how much infrared the atmosphere absorbs, the albedo and the Sun’s brightness, and watch the surface temperature move to a new energy balance.',
    packId: 'environmental-science-climate',
    standards: 'AP Env Sci 9.3 (The Greenhouse Effect) · HS-ESS2-4',
    renderer: '2d',
    Component: lazy(() => import('./presets2d/GreenhouseEffect2D')),
  },
]

export function findLabModel(id: string | undefined): LabModel | undefined {
  return LAB_MODELS.find((model) => model.id === id)
}

/** The featured "daily lab" — same for everyone on a given day. */
export function dailyLabModel(date = new Date()): LabModel {
  return dailyPick(LAB_MODELS, date)
}
