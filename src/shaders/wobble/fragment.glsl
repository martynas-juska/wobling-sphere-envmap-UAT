varying float vWobble;

void main() {
    // csm_FragColor.rgb = vec3(vWobble);

    // Subtle metallic color variation based on deformation
    float wobbleIntensity = vWobble * 0.3;

    //Surface tension effect (brighter on peaks, darker in valleys)
    float surfaceTension = smoothstep(0.3, 0.7, wobbleIntensity);

    // Steel tint with surface tension
    vec3 baseTint = vec3(0.85, 0.85, 0.84);   // Warm steel base
    vec3 peakTint = vec3(0.90, 0.92, 0.95);   // Cool highlights
    vec3 valleyTint = vec3(0.78, 0.78, 0.77); // Darker valleys

    // Mix based on surface tension
    vec3 tint = mix(
        mix(valleyTint, baseTint, surfaceTension),
        peakTint,
        wobbleIntensity
    );
    
    // // Slight blue-gray tint on deformed areas (like real metal stress)
    // vec3 tint = mix(
    //     vec3(0.85, 0.85, 0.84),  // Warm steel base (slight warmth in B channel)
    //     vec3(0.90, 0.92, 0.95),  // Cooler highlights where metal flows
    //     wobbleIntensity
    // );
    
    csm_DiffuseColor.rgb *= tint;
    
    // More dramatic roughness variation (liquid steel has varying surface tension)
    csm_Roughness = mix(0.18, 0.05, wobbleIntensity);

    // Slight metalness variation (optional but adds realism)
    csm_Metalness = mix(0.95, 1.0, wobbleIntensity * 0.5);

}