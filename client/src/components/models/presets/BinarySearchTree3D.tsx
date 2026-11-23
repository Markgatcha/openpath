import * as THREE from 'three'
import { ModelViewer } from '../ModelViewer'
import {
  disposeObject,
  polyline,
  setPolyline,
  type Hotspot,
  type ModelDefinition,
  type Params,
  type SceneContext,
} from '../engine'

/**
 * Procedural 3D Binary Search Tree & AVL Self-Balancing Visualizer:
 * - Inserts a deterministic key sequence into either an AVL self-balancing
 *   tree (performing LL, RR, LR, RL rotations so |BF| <= 1) or an unbalanced
 *   BST so students see O(log N) vs skewed height side-by-side!
 * - Animates a glowing 3D traversal ray & visitor probe stepping through
 *   In-Order (LNR), Pre-Order (NLR), or Level-Order (BFS) sequences.
 */

interface BstNode {
  key: number
  height: number
  left: BstNode | null
  right: BstNode | null
  pos: THREE.Vector3
  depth: number
}

// Sequence intentionally chosen with semi-sorted runs so unbalanced BST skews
// noticeably while AVL rotations keep it compact and symmetric!
const KEY_POOL = [
  18, 24, 32, 40, 46, 12, 8, 52, 60, 28, 15, 5, 36, 49, 68, 21, 10, 30, 43, 56, 74,
]

function nodeHeight(n: BstNode | null): number {
  return n ? n.height : 0
}

function updateHeight(n: BstNode): void {
  n.height = 1 + Math.max(nodeHeight(n.left), nodeHeight(n.right))
}

function balanceFactor(n: BstNode | null): number {
  return n ? nodeHeight(n.left) - nodeHeight(n.right) : 0
}

function rotateRight(y: BstNode): BstNode {
  const x = y.left!
  const t2 = x.right
  x.right = y
  y.left = t2
  updateHeight(y)
  updateHeight(x)
  return x
}

function rotateLeft(x: BstNode): BstNode {
  const y = x.right!
  const t2 = y.left
  y.left = x
  x.right = t2
  updateHeight(x)
  updateHeight(y)
  return y
}

function insertNode(root: BstNode | null, key: number, avl: boolean): BstNode {
  if (!root) {
    return { key, height: 1, left: null, right: null, pos: new THREE.Vector3(), depth: 0 }
  }
  if (key < root.key) root.left = insertNode(root.left, key, avl)
  else if (key > root.key) root.right = insertNode(root.right, key, avl)
  else return root

  updateHeight(root)
  if (!avl) return root

  const bf = balanceFactor(root)
  if (bf > 1 && root.left && key < root.left.key) return rotateRight(root)
  if (bf < -1 && root.right && key > root.right.key) return rotateLeft(root)
  if (bf > 1 && root.left && key > root.left.key) {
    root.left = rotateLeft(root.left)
    return rotateRight(root)
  }
  if (bf < -1 && root.right && key < root.right.key) {
    root.right = rotateRight(root.right)
    return rotateLeft(root)
  }
  return root
}

function layoutTree(root: BstNode | null): { nodes: BstNode[]; maxBf: number } {
  const all: BstNode[] = []
  let inOrderIdx = 0
  let maxDepth = 0
  let maxBf = 0

  function countAndDepth(n: BstNode | null, d: number) {
    if (!n) return
    n.depth = d
    if (d > maxDepth) maxDepth = d
    maxBf = Math.max(maxBf, Math.abs(balanceFactor(n)))
    countAndDepth(n.left, d + 1)
    all.push(n)
    countAndDepth(n.right, d + 1)
  }
  countAndDepth(root, 0)

  const total = Math.max(1, all.length)
  const yTop = Math.min(2.8, maxDepth * 0.58)
  const vStep = maxDepth > 0 ? Math.min(1.25, (yTop * 2 + 0.6) / maxDepth) : 1

  function assignPos(n: BstNode | null) {
    if (!n) return
    assignPos(n.left)
    const xNorm = total > 1 ? inOrderIdx / (total - 1) - 0.5 : 0
    inOrderIdx += 1
    const x = xNorm * Math.min(7.8, 2.6 + total * 0.28)
    const y = yTop - n.depth * vStep
    // Subtle 3D z-fanning by depth parity so rotating camera reveals 3D hierarchy
    const z = Math.sin(n.depth * 1.2 + xNorm * 2.4) * 0.85
    n.pos.set(x, y, z)
    assignPos(n.right)
  }
  assignPos(root)

  return { nodes: all, maxBf }
}

function computeTraversal(root: BstNode | null, mode: number): BstNode[] {
  const order: BstNode[] = []
  if (!root) return order
  if (mode === 0) {
    // In-Order (Left, Node, Right -> sorted keys)
    const walk = (n: BstNode | null) => {
      if (!n) return
      walk(n.left)
      order.push(n)
      walk(n.right)
    }
    walk(root)
  } else if (mode === 1) {
    // Pre-Order (Node, Left, Right)
    const walk = (n: BstNode | null) => {
      if (!n) return
      order.push(n)
      walk(n.left)
      walk(n.right)
    }
    walk(root)
  } else {
    // Level-Order BFS
    const queue: BstNode[] = [root]
    while (queue.length > 0) {
      const cur = queue.shift()!
      order.push(cur)
      if (cur.left) queue.push(cur.left)
      if (cur.right) queue.push(cur.right)
    }
  }
  return order
}

const TRAVERSAL_NAMES = ['In-Order (LNR)', 'Pre-Order (NLR)', 'Breadth-First (BFS)']

function build({ scene, palette }: SceneContext, initial: Params) {
  const rootGroup = new THREE.Group()
  scene.add(rootGroup)

  const treeGroup = new THREE.Group()
  rootGroup.add(treeGroup)

  // Glowing traversal probe orb + ray path polyline
  const probe = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 18),
    new THREE.MeshPhysicalMaterial({
      color: palette.amber,
      emissive: palette.amber,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.55,
      roughness: 0.2,
    }),
  )
  rootGroup.add(probe)

  const rayLine = polyline([new THREE.Vector3(), new THREE.Vector3()], palette.amber, 0.9)
  rootGroup.add(rayLine)

  let cacheKey = ''
  let bstRoot: BstNode | null = null
  let traversalSeq: BstNode[] = []
  let maxBalanceFactor = 0
  let nodeVisuals = new Map<BstNode, { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }>()
  let cursor = 0
  const upVec = new THREE.Vector3(0, 1, 0)

  function rebuild(p: Params) {
    disposeObject(treeGroup)
    treeGroup.clear()
    nodeVisuals = new Map()

    const count = Math.max(5, Math.min(KEY_POOL.length, Math.round(p.nodeCount)))
    const useAvl = p.avlBalance === 1
    bstRoot = null
    for (let i = 0; i < count; i += 1) {
      bstRoot = insertNode(bstRoot, KEY_POOL[i], useAvl)
    }
    const { maxBf } = layoutTree(bstRoot)
    maxBalanceFactor = maxBf
    traversalSeq = computeTraversal(bstRoot, Math.round(p.traversal))
    cursor = 0

    const sphereGeo = new THREE.SphereGeometry(0.24, 22, 16)
    const edgeGeo = new THREE.CylinderGeometry(0.042, 0.042, 1, 10)

    const buildMeshes = (n: BstNode | null) => {
      if (!n) return
      const mat = new THREE.MeshStandardMaterial({
        color: n === bstRoot ? palette.violet : palette.brand,
        roughness: 0.3,
        metalness: 0.2,
      })
      const mesh = new THREE.Mesh(sphereGeo, mat)
      mesh.position.copy(n.pos)
      treeGroup.add(mesh)
      nodeVisuals.set(n, { mesh, mat })

      for (const child of [n.left, n.right]) {
        if (!child) continue
        const isLeft = child === n.left
        const edgeMat = new THREE.MeshStandardMaterial({
          color: isLeft ? 0x38bdf8 : 0xa78bfa,
          roughness: 0.45,
        })
        const cyl = new THREE.Mesh(edgeGeo, edgeMat)
        const dir = child.pos.clone().sub(n.pos)
        const len = dir.length()
        cyl.position.copy(n.pos).add(child.pos).multiplyScalar(0.5)
        cyl.scale.set(1, len, 1)
        cyl.quaternion.setFromUnitVectors(upVec, dir.normalize())
        treeGroup.add(cyl)
        buildMeshes(child)
      }
    }
    buildMeshes(bstRoot)
  }

  function sync(p: Params, dt: number) {
    const nextKey = `${Math.round(p.nodeCount)}:${Math.round(p.traversal)}:${p.avlBalance}`
    if (nextKey !== cacheKey) {
      cacheKey = nextKey
      rebuild(p)
    }
    if (traversalSeq.length === 0) return

    cursor = (cursor + dt * p.speed * 1.6) % traversalSeq.length
    const activeIdx = Math.floor(cursor)
    const frac = cursor - activeIdx
    const curNode = traversalSeq[activeIdx]
    const nextNode = traversalSeq[(activeIdx + 1) % traversalSeq.length]

    probe.position.copy(curNode.pos).lerp(nextNode.pos, Math.min(1, Math.max(0, (frac - 0.55) / 0.45)))

    // Color visited nodes emerald, current node amber, unvisited brand/violet
    traversalSeq.forEach((n, idx) => {
      const vis = nodeVisuals.get(n)
      if (!vis) return
      if (idx === activeIdx) {
        vis.mat.color.setHex(palette.amber)
        vis.mat.emissive.setHex(0x92400e)
      } else if (idx < activeIdx) {
        vis.mat.color.setHex(palette.emerald)
        vis.mat.emissive.setHex(0x064e3b)
      } else {
        vis.mat.color.setHex(n === bstRoot ? palette.violet : palette.brand)
        vis.mat.emissive.setHex(0x000000)
      }
    })

    // Trail polyline through visited sequence up to probe
    const visitedPts = traversalSeq.slice(0, activeIdx + 1).map((n) => n.pos.clone())
    visitedPts.push(probe.position.clone())
    if (visitedPts.length >= 2) {
      setPolyline(rayLine, visitedPts)
    }
  }

  sync(initial, 0)

  const hotspots: Hotspot[] = [
    {
      id: 'root',
      label: 'Root Node',
      title: 'BST Ordering Invariant',
      body: 'At every node k, all keys in its left subtree (cyan branch) satisfy key < k and all keys in its right subtree (violet branch) satisfy key > k.',
      position: (t) =>
        t.copy(bstRoot?.pos ?? new THREE.Vector3(0, 2, 0)).add(new THREE.Vector3(0, 0.36, 0)),
    },
    {
      id: 'probe',
      label: 'Traversal Ray',
      title: 'Active Traversal Cursor',
      body: 'In-Order visits keys in strictly ascending sorted order; Pre-Order visits parents before children (ideal for cloning trees); BFS sweeps level by level via a FIFO queue.',
      position: (t) => t.copy(probe.position).add(new THREE.Vector3(0.32, 0.25, 0)),
    },
    {
      id: 'avl',
      label: 'AVL Rotations',
      title: 'O(log N) Height Guarantee',
      body: 'Toggle off AVL Self-Balancing to see semi-sorted insertions skew the tree tall; toggle it back on to watch LL/RR/LR/RL rotations clamp |balance factor| ≤ 1!',
      position: (t) => t.set(-2.6, -1.6, 0),
    },
  ]

  return {
    hotspots,
    update(p: Params, dt: number) {
      sync(p, dt)
    },
    readouts: (p: Params) => {
      const idx = Math.min(traversalSeq.length - 1, Math.floor(cursor))
      const currentKey = traversalSeq[idx]?.key ?? '—'
      const h = nodeHeight(bstRoot)
      return [
        { label: 'Nodes / Height', value: `N = ${traversalSeq.length} · h = ${h}` },
        { label: 'Max |Balance|', value: `${maxBalanceFactor} ${maxBalanceFactor <= 1 ? '(AVL ✓)' : '(Skewed)'}` },
        { label: 'Mode', value: TRAVERSAL_NAMES[Math.round(p.traversal)] ?? '' },
        { label: 'Visiting Key', value: `#${idx + 1} → key ${currentKey}` },
      ]
    },
  }
}

export const BST_3D_MODEL: ModelDefinition = {
  id: 'bst-3d',
  title: '3D Binary Search Tree & AVL Rotations',
  subtitle:
    'Compare AVL self-balancing rotations against unbalanced BST skew while animating In-Order, Pre-Order, and BFS ray traversals.',
  camera: [0, 0.8, 9.4],
  params: [
    {
      kind: 'slider',
      id: 'nodeCount',
      label: 'Tree Nodes Count',
      min: 5,
      max: 21,
      step: 2,
      initial: 15,
    },
    {
      kind: 'slider',
      id: 'speed',
      label: 'Animation Traversal Speed',
      min: 0.2,
      max: 3.0,
      step: 0.2,
      initial: 1.2,
      unit: '×',
    },
    {
      kind: 'choice',
      id: 'traversal',
      label: 'Traversal Mode',
      choices: ['In-Order (Sorted)', 'Pre-Order (Root First)', 'Level-Order (BFS)'],
      initial: 0,
    },
    { kind: 'toggle', id: 'avlBalance', label: 'AVL Self-Balancing Rotations', initial: true },
  ],
  build,
}

export default function BinarySearchTree3D() {
  return <ModelViewer model={BST_3D_MODEL} />
}
