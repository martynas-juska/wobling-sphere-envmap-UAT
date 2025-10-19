uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uStrength;
uniform float uWarpPositionFrequency;
uniform float uWarpTimeFrequency;
uniform float uWarpStrength;


attribute vec4 tangent;

varying float vWobble;

#include ../includes/simplexNoise4d.glsl

vec3 getWobble(vec3 position) {

    vec3 warpedPosition = position;

    warpedPosition += simplexNoise4d(vec4(
        position * uWarpPositionFrequency,
        uTime * uWarpTimeFrequency
    )) * uWarpStrength;

    // return simplexNoise4d(vec4(
    //     warpedPosition * uPositionFrequency, // XYZ
    //     uTime * uTimeFrequency         // W  
    // )) * uStrength;

    //ADDED v2: traveling waves by offsetting position over time

    vec3 travelingPosition = warpedPosition + vec3(
        uTime * 0.1,  // Travel in X direction
        uTime * 0.08,  // Travel in Y direction  
        uTime * 0.06  // Travel in Z direction
    );

    // ADDED:
    // Three independent noise values for X, Y, Z displacement
    // Different offsets ensure unique patterns per axis

    float noiseX = simplexNoise4d(vec4(
        travelingPosition * uPositionFrequency,
        uTime * uTimeFrequency
    ));

    float noiseY = simplexNoise4d(vec4(
        travelingPosition * uPositionFrequency + 200.0,
        uTime * uTimeFrequency + 200.0
    ));

    float noiseZ = simplexNoise4d(vec4(
        travelingPosition * uPositionFrequency + 200.0,
        uTime * uTimeFrequency + 200.0
    ));

    //ADDED v2: 
    vec3 oppositeTravel = warpedPosition - vec3(
        uTime * 0.08,
        uTime * 0.05,
        uTime * 0.07
    );

    float flowX = simplexNoise4d(vec4(
        oppositeTravel * uPositionFrequency * 0.5,
        uTime * uTimeFrequency * 0.8
    )) * 0.8;

    float flowY = simplexNoise4d(vec4(
        oppositeTravel * uPositionFrequency * 0.5 + 300.0,
        uTime * uTimeFrequency * 0.8 + 300.0
    )) * 0.8;

    float flowZ = simplexNoise4d(vec4(
        oppositeTravel * uPositionFrequency * 0.5 + 400.0,
        uTime * uTimeFrequency * 0.8 + 400.0
    )) * 0.8;

    // Add medium-frequency detail layer (more ripples)
    
    float detailX = simplexNoise4d(vec4(
        warpedPosition * uPositionFrequency * 2.0,
        uTime * uTimeFrequency * 1.5
    )) * 0.3;

    float detailY = simplexNoise4d(vec4(
        warpedPosition * uPositionFrequency * 2.0 + 300.0,
        uTime * uTimeFrequency * 1.5 + 300.0
    )) * 0.3;

    float detailZ = simplexNoise4d(vec4(
        warpedPosition * uPositionFrequency * 2.0 + 400.0,
        uTime * uTimeFrequency * 1.5 + 400.0
    )) * 0.3;

    // Combine all layers

    return vec3(
        noiseX + detailX + flowX,
        noiseY + detailY + flowY,
        noiseZ + detailZ + flowZ
    ) * uStrength;

}

void main() {

    vec3 biTangent = cross(normal, tangent.xyz);

    //Neighbours Positions
    float shift = 0.01;
    vec3 positionA = csm_Position + tangent.xyz * shift;
    vec3 positionB = csm_Position + biTangent.xyz * shift;

    // ADDED: Get 3D wobble vector
    vec3 wobble3D = getWobble(csm_Position);

    // Apply wobble in THREE directions (this creates sideways movement!)
    csm_Position += wobble3D.x * normal * 1.0;        // Push along normal
    csm_Position += wobble3D.y * tangent.xyz * 1.0;   // Slide along tangent (sideways)
    csm_Position += wobble3D.z * biTangent * 1.0;     // Slide along bitangent (sideways)
    
    // Apply same wobble logic to neighbor positions
    vec3 wobbleA = getWobble(positionA);
    positionA += wobbleA.x * normal;
    positionA += wobbleA.y * tangent.xyz;
    positionA += wobbleA.z * biTangent;
    
    vec3 wobbleB = getWobble(positionB);
    positionB += wobbleB.x * normal;
    positionB += wobbleB.y * tangent.xyz;
    positionB += wobbleB.z * biTangent;
 
    // Wobble
    // float wobble = getWobble(csm_Position);
    // csm_Position += wobble * normal;
    // positionA += getWobble(positionA) * normal;
    // positionB += getWobble(positionB) * normal;

    //Compute Normals

    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB);

    // Varyings
    // vWobble = wobble / uStrength;
    vWobble = length(wobble3D) / uStrength;

}