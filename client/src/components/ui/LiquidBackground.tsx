import React, { useEffect, useRef } from 'react';

// --- Shader Source adapted from Framer Animated Liquid Background ---
const vertexShaderSource = `#version 300 es
in vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
    vec3 color1 = c1.rgb * c1.a;
    vec3 color2 = c2.rgb * c2.a;
    vec3 color3 = c3.rgb * c3.a;

    float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
    float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

    vec3 blended_color_2 = mix(color1, color2, r1);
    float blended_opacity_2 = mix(c1.a, c2.a, r1);

    vec3 c = mix(blended_color_2, color3, r2);
    float o = mix(blended_opacity_2, c3.a, r2);
    return vec4(c, o);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Time scaling
    float t = .5 * u_time;

    float noise_scale = .0005 + .006 * u_scale;

    uv -= .5;
    uv *= (noise_scale * u_resolution);
    uv = rotate(uv, u_rotation * .5 * PI);
    uv /= u_pixelRatio;
    uv += .5;

    float n1 = noise(uv * 1. + t);
    float n2 = noise(uv * 2. - t);
    float angle = n1 * TWO_PI;
    uv.x += 4. * u_distortion * n2 * cos(angle);
    uv.y += 4. * u_distortion * n2 * sin(angle);

    float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
    for (float i = 1.; i <= iterations_number; i++) {
        uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
        uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
    }

    float proportion = clamp(u_proportion, 0., 1.);

    float shape = 0.;
    float mixer = 0.;
    if (u_shape < .5) {
      vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
      shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else if (u_shape < 1.5) {
      vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
      float f = fract(stripes_shape_uv.y);
      shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else {
      float sh = 1. - uv.y;
      sh -= .5;
      sh /= (noise_scale * u_resolution.y);
      sh += .5;
      float shape_scaling = .2 * (1. - u_shapeScale);
      shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
      mixer = shape;
    }

    vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);

    fragColor = vec4(color_mix.rgb, color_mix.a);
}
`;

// Helper to convert hex to vec4
const hexToVec4 = (hex: string): [number, number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1.0];
};

interface LiquidBackgroundProps {
    className?: string;
    // Colors
    color1?: string;
    color2?: string;
    color3?: string;
    // Animation
    speed?: number;
    scale?: number;
    // Liquid Specifics
    distortion?: number; // 0-100?
    swirl?: number; // 0-100?
    swirlIterations?: number;
    softness?: number;
}

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({
    className = "",
    color1 = "#F3F4F6", // Light gray (paper-ish)
    color2 = "#E0E7FF", // Indigo-100
    color3 = "#FFFFFF",
    speed = 0.2, // Adjusted for manual time tick
    scale = 1.0
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;

        // Compiled Shaders
        const vert = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vert, vertexShaderSource);
        gl.compileShader(vert);
        if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vert));
            return;
        }

        const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(frag, fragmentShaderSource);
        gl.compileShader(frag);
        if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(frag));
            return;
        }

        const program = gl.createProgram()!;
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Quad Buffer
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        // Uniforms
        const uTime = gl.getUniformLocation(program, 'u_time');
        const uResolution = gl.getUniformLocation(program, 'u_resolution');
        const uPixelRatio = gl.getUniformLocation(program, 'u_pixelRatio');

        // Params
        const uColor1 = gl.getUniformLocation(program, 'u_color1');
        const uColor2 = gl.getUniformLocation(program, 'u_color2');
        const uColor3 = gl.getUniformLocation(program, 'u_color3');
        const uScale = gl.getUniformLocation(program, 'u_scale');

        // Hardcoded 'Lava/Prism' style defaults from Framer template
        const uRotation = gl.getUniformLocation(program, 'u_rotation');
        const uProportion = gl.getUniformLocation(program, 'u_proportion');
        const uSoftness = gl.getUniformLocation(program, 'u_softness');
        const uShape = gl.getUniformLocation(program, 'u_shape');
        const uShapeScale = gl.getUniformLocation(program, 'u_shapeScale');
        const uDistortion = gl.getUniformLocation(program, 'u_distortion');
        const uSwirl = gl.getUniformLocation(program, 'u_swirl');
        const uSwirlIterations = gl.getUniformLocation(program, 'u_swirlIterations');

        let animationFrameId: number;
        let startTime = performance.now();

        const render = () => {
            const time = (performance.now() - startTime) * 0.001 * speed;

            // Resize if needed
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }

            gl.uniform1f(uTime, time);
            gl.uniform2f(uResolution, canvas.width, canvas.height);
            gl.uniform1f(uPixelRatio, window.devicePixelRatio);

            // Update Dynamic Colors
            gl.uniform4fv(uColor1, hexToVec4(color1));
            gl.uniform4fv(uColor2, hexToVec4(color2));
            gl.uniform4fv(uColor3, hexToVec4(color3));
            gl.uniform1f(uScale, scale);

            // Static params (can be exposed as props if needed)
            gl.uniform1f(uRotation, -50 * Math.PI / 180);
            gl.uniform1f(uProportion, 0.5); // 0.01 in template, adjusted
            gl.uniform1f(uSoftness, 0.47);
            gl.uniform1f(uShape, 0.0); // Checks
            gl.uniform1f(uShapeScale, 0.45);
            gl.uniform1f(uDistortion, 0.0); // 0.0 in Prism
            gl.uniform1f(uSwirl, 0.5);
            gl.uniform1f(uSwirlIterations, 16);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            gl.deleteProgram(program);
            gl.deleteShader(vert);
            gl.deleteShader(frag);
        };
    }, [color1, color2, color3, speed, scale]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full block ${className}`}
        />
    );
};
