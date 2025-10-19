import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import GUI from 'lil-gui'
import wobbleVertexShadder from './shaders/wobble/vertex.glsl'
import wobbleFragmentShader from './shaders/wobble/fragment.glsl'

console.log(mergeVertices);

/**
 * Mobile Detection & Performance Settings
 */
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const isLowEnd = navigator.hardwareConcurrency <= 4 || isMobile

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 })

if (isMobile) {
    gui.hide()
}

const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const rgbeLoader = new RGBELoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Environment map
 */
rgbeLoader.load('./urban_alley_01_1k.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

/**
 * Wobble
 */

const uniforms = {
    uTime: new THREE.Uniform(0),

    uPositionFrequency: new THREE.Uniform(0.233),
    uTimeFrequency: new THREE.Uniform(0.13),
    uStrength: new THREE.Uniform(0.492),

    uWarpPositionFrequency: new THREE.Uniform(0.4),
    uWarpTimeFrequency: new THREE.Uniform(0.3),
    uWarpStrength: new THREE.Uniform(1.8)
}

// Material
const material = new CustomShaderMaterial({

    //CSM
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: wobbleVertexShadder,
    fragmentShader: wobbleFragmentShader,
    uniforms: uniforms,
    silent: true,

    //MeshPhysicalmaterial
    metalness: 0.95,
    roughness: 0.18,
    color: '#d0d0d0',
    transmission: 0,
    ior: 2.5,
    thickness: 0,
    transparent: false,
    wireframe: false,
    clearcoat: 0.7, 
    clearcoatRoughness: 0.08
})

const Depthmaterial = new CustomShaderMaterial({

    //CSM
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: wobbleVertexShadder,
    uniforms: uniforms,
    silent: true,

    // MeshDepthMaterial
    depthPacking: THREE.RGBADepthPacking

})

// Tweaks
if (!isMobile) {
    
    gui.add(uniforms.uPositionFrequency, 'value', 0, 2, 0.001).name('uPositionFrequency')
    gui.add(uniforms.uTimeFrequency, 'value', 0, 2, 0.001).name('uTimeFrequency')
    gui.add(uniforms.uStrength, 'value', 0, 2, 0.001).name('uStrength')
    
    gui.add(uniforms.uWarpPositionFrequency, 'value', 0, 2, 0.001).name('uWarpPositionFrequency')
    gui.add(uniforms.uWarpTimeFrequency, 'value', 0, 2, 0.001).name('uWarpTimeFrequency')
    gui.add(uniforms.uWarpStrength, 'value', 0, 2, 0.001).name('uWarpStrength')
    
    
    
    gui.add(material, 'metalness', 0, 1, 0.001)
    gui.add(material, 'roughness', 0, 1, 0.001)
    gui.add(material, 'transmission', 0, 1, 0.001)
    gui.add(material, 'ior', 0, 10, 0.001)
    gui.add(material, 'thickness', 0, 10, 0.001)
    gui.addColor(material, 'color')
}

// Geometry
const subdivisions = isMobile ? 40 : isLowEnd ? 50 : 65

let geometry = new THREE.IcosahedronGeometry(2.5, subdivisions)
geometry = mergeVertices(geometry)
geometry.computeTangents()
console.log(geometry.attributes);


// Mesh
const wobble = new THREE.Mesh(geometry, material)
wobble.customDepthMaterial = Depthmaterial
wobble.receiveShadow = true
wobble.castShadow = true
scene.add(wobble)

/**
 * Plane
 */
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15, 15),
    new THREE.MeshStandardMaterial()
)
plane.receiveShadow = true
plane.rotation.y = Math.PI
plane.position.y = - 5
plane.position.z = 5
scene.add(plane)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 2, - 2.25)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(13, - 3, - 5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
// renderer.setPixelRatio(sizes.pixelRatio)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Materials
    uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

/**
 * Cleanup - Prevent memory leaks
 */
window.addEventListener('beforeunload', () => {
    geometry.dispose()
    material.dispose()
    Depthmaterial.dispose()
    renderer.dispose()
    controls.dispose()
})

