/* ==========================================================================
   LEGACY / ARCHIVED: This file is an unused Three.js sphere blob experiment.
   The active production 3D scene is powered by main-spline.js.
   This file is intentionally empty to prevent duplicate WebGL contexts.
   ========================================================================== */

import * as THREE from 'three';

// --------------------------------------------------------
// SHADER BOILERPLATE: 3D Simplex Noise
// --------------------------------------------------------
const noise3D = `
// Simplex 3D Noise 
// by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0.0 + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

// --------------------------------------------------------
// SHADERS FOR MAIN COLOR BLOB
// --------------------------------------------------------
const vertexShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying float vNoise;

${noise3D}

void main() {
    vUv = uv;
    vNormal = normal;
    
    // Create base noise for displacement
    // Scale position down slightly so noise is smoother
    float noise = snoise(position * 0.8 + uTime * 0.2);
    
    // Additional high frequency noise
    float highFreq = snoise(position * 2.5 - uTime * 0.3) * 0.3;
    
    vNoise = noise + highFreq;
    
    // Displace vertex along normal
    vec3 newPosition = position + normal * (vNoise * 0.4);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying float vNoise;

// Function to map a value from one range to another
float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// Heatmap colors
const vec3 c1 = vec3(0.05, 0.2, 0.4); // Dark Blue
const vec3 c2 = vec3(0.0, 0.8, 0.9);  // Cyan
const vec3 c3 = vec3(0.9, 0.5, 0.0);  // Orange
const vec3 c4 = vec3(0.9, 0.1, 0.1);  // Red
const vec3 c5 = vec3(0.1, 0.0, 0.0);  // Dark Red/Black

void main() {
    // We'll use the vNoise value to sample our color ramp
    // vNoise ranges roughly from -1.3 to 1.3 based on our multi-octave setup
    
    float n = vNoise * 0.5 + 0.5; // normalize to roughly 0 to 1
    
    // Smoothstep to create clear bands of color similar to screenshot
    vec3 color;
    if (n < 0.25) {
        color = mix(c1, c2, map(n, 0.0, 0.25, 0.0, 1.0));
    } else if (n < 0.5) {
        color = mix(c2, c3, map(n, 0.25, 0.5, 0.0, 1.0));
    } else if (n < 0.75) {
        color = mix(c3, c4, map(n, 0.5, 0.75, 0.0, 1.0));
    } else {
        color = mix(c4, c5, map(n, 0.75, 1.0, 0.0, 1.0));
    }
    
    // Add some rim lighting based on normal
    vec3 viewDirection = normalize(cameraPosition - vNormal); // Approximation
    float fresnel = dot(viewDirection, vNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    color += fresnel * vec3(0.1, 0.4, 0.6); // slight blue rim glow
    
    gl_FragColor = vec4(color, 1.0);
}
`;


// --------------------------------------------------------
// NOISY GRAY BLOB SHADERS
// --------------------------------------------------------
const grayVertexShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying float vNoise;

${noise3D}

void main() {
    vUv = uv;
    vNormal = normal;
    
    // Gray small blobs have bumpy noise
    float noise = snoise(position * 3.0 + uTime * 0.4) * 0.1;
    vNoise = noise;
    
    vec3 newPosition = position + normal * noise;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const grayFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying float vNoise;

void main() {
    // Basically dark gray with lighter gray spots on bumps
    vec3 baseColor = vec3(0.15, 0.15, 0.15);
    vec3 highlight = vec3(0.4, 0.4, 0.4);
    
    float mixVal = vNoise * 5.0 + 0.5;
    vec3 color = mix(baseColor, highlight, clamp(mixVal, 0.0, 1.0));
    
    // Fake lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    color *= (diff * 0.5 + 0.5); // wrap lighting
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// --------------------------------------------------------
// SETUP THREE.JS SCENE
// --------------------------------------------------------
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 10;

// Geometries & Materials
const sphereGeo = new THREE.SphereGeometry(1.5, 128, 128); // high res for displacement

const mainBlobMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        uTime: { value: 0 }
    }
});

const grayBlobMaterial = new THREE.ShaderMaterial({
    vertexShader: grayVertexShader,
    fragmentShader: grayFragmentShader,
    uniforms: {
        uTime: { value: 0 }
    }
});

// Objects
const mainBlob = new THREE.Mesh(sphereGeo, mainBlobMaterial);
scene.add(mainBlob);
// Position big blob to the right side
mainBlob.position.set(3, -1, 0);

const smallGeo = new THREE.SphereGeometry(0.5, 64, 64);
const grayBlob1 = new THREE.Mesh(smallGeo, grayBlobMaterial);
scene.add(grayBlob1);
grayBlob1.position.set(1.5, -2, -1);

const tinyGeo = new THREE.SphereGeometry(0.3, 64, 64);
const grayBlob2 = new THREE.Mesh(tinyGeo, grayBlobMaterial);
scene.add(grayBlob2);
grayBlob2.position.set(5.5, 0.5, -2);


// --------------------------------------------------------
// INTERACTIVITY (Mouse Tracking & Resizing)
// --------------------------------------------------------
let mouse = new THREE.Vector2(0, 0);
let targetMouse = new THREE.Vector2(0, 0);

window.addEventListener('mousemove', (e) => {
    // Normalized mouse coordinates: -1 to 1
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Adjust position of big blob on smaller screens
    if (window.innerWidth < 768) {
        mainBlob.position.set(0, -2, 0);
    } else {
        mainBlob.position.set(3, -1, 0);
    }
}
window.addEventListener('resize', resize);
resize();

// --------------------------------------------------------
// ANIMATION LOOP
// --------------------------------------------------------
const clock = new THREE.Clock();
let basePosition = new THREE.Vector3(3, -1, 0);

function animate() {
    const time = clock.getElapsedTime();
    
    // Update Uniforms
    mainBlobMaterial.uniforms.uTime.value = time;
    grayBlobMaterial.uniforms.uTime.value = time;

    // Small floating animations
    grayBlob1.position.y = -2 + Math.sin(time * 0.8) * 0.2;
    grayBlob1.position.x = 1.5 + Math.cos(time * 0.5) * 0.1;
    grayBlob1.rotation.y = time * 0.2;
    
    grayBlob2.position.y = 0.5 + Math.cos(time * 1.2) * 0.1;
    grayBlob2.rotation.x = time * 0.3;

    // Mouse tracking for main blob (lerp smooth movement)
    mouse.lerp(targetMouse, 0.05);
    
    // Base position offsets based on mouse
    if (window.innerWidth >= 768) {
        mainBlob.position.x = 3 + mouse.x * 2.0;
        mainBlob.position.y = -1 + mouse.y * 2.0;
    } else {
        // Mobile less intense movement
        mainBlob.position.x = mouse.x * 0.5;
        mainBlob.position.y = -2 + mouse.y * 0.5;
    }
    
    // Rotate slightly based on mouse to add pseudo 3d tracking feel
    mainBlob.rotation.x = -mouse.y * 0.5;
    mainBlob.rotation.y = mouse.x * 0.5;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();
