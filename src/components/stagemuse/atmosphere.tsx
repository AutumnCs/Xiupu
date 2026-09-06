"use client";

import { useEffect, useRef } from "react";

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform sampler2D scene;
uniform vec2 resolution;
uniform vec2 imageSize;
uniform vec2 pointer;
uniform float elapsed;
uniform float impulse;
mat2 rotate(float angle) { float c = cos(angle); float s = sin(angle); return mat2(c, -s, s, c); }
void main() {
  vec2 anchor = vec2(0.554, 0.416);
  float scale = max(resolution.x / imageSize.x, resolution.y / imageSize.y);
  vec2 rendered = imageSize * scale;
  vec2 origin = (resolution - rendered) * anchor;
  vec2 source = (uv * resolution - origin) / rendered;
  float foreground = smoothstep(0.22, 0.02, uv.y) * 0.55;
  float floorLayer = smoothstep(0.70, 1.0, uv.y) * 0.35;
  source.x -= pointer.x * (foreground + floorLayer) * 0.010;
  source.y -= pointer.y * 0.004;
  vec2 relative = (source - anchor) * imageSize;
  float radius = length(relative);
  float outerField = 1.0 - smoothstep(150.0, 330.0, radius);
  float innerField = 1.0 - smoothstep(34.0, 175.0, radius);
  float breath = sin(elapsed * 0.52) * 0.006;
  vec2 flow = vec2(sin(relative.y * 0.014 + elapsed * 0.32), cos(relative.x * 0.013 - elapsed * 0.29)) * 0.9;
  vec2 offset = (relative * breath + flow + pointer * 6.0) * outerField;
  source -= offset / imageSize;
  vec4 color = texture2D(scene, clamp(source, vec2(0.0), vec2(1.0)));
  vec2 outerSource = anchor + (rotate(-elapsed * 0.018) * (source - anchor));
  vec2 innerSource = anchor + (rotate(elapsed * 0.035) * (source - anchor));
  vec4 outerColor = texture2D(scene, clamp(outerSource, vec2(0.0), vec2(1.0)));
  vec4 innerColor = texture2D(scene, clamp(innerSource, vec2(0.0), vec2(1.0)));
  color.rgb = mix(color.rgb, outerColor.rgb, outerField * 0.11);
  color.rgb = mix(color.rgb, innerColor.rgb, innerField * 0.14);
  float shimmer = impulse * outerField * 0.045;
  color.rgb += vec3(shimmer, shimmer * 0.83, shimmer * 0.86);
  gl_FragColor = color;
}`;

export function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const atmosphere = canvas.parentElement;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      resolution: gl.getUniformLocation(program, "resolution"), imageSize: gl.getUniformLocation(program, "imageSize"),
      pointer: gl.getUniformLocation(program, "pointer"), elapsed: gl.getUniformLocation(program, "elapsed"), impulse: gl.getUniformLocation(program, "impulse"),
    };
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const picture = new Image();
    let ready = false; let stopped = false; let frame = 0; let time = 0; let last = 0; let impulse = 0;
    const target = { x: 0, y: 0 }; const cursor = { x: 0, y: 0 }; const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => { const dpr = Math.min(window.devicePixelRatio, 1.75); canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uniforms.resolution, canvas.width, canvas.height); };
    const render = (now: number) => { frame = requestAnimationFrame(render); if (!ready || document.hidden || now - last < 30) return; const delta = Math.min((now - last) / 1000, 0.05); last = now; if (!reduceMotion.matches) time += delta; cursor.x += (target.x - cursor.x) * 0.06; cursor.y += (target.y - cursor.y) * 0.06; impulse *= 0.91; gl.uniform2f(uniforms.pointer, reduceMotion.matches ? 0 : cursor.x, reduceMotion.matches ? 0 : cursor.y); gl.uniform1f(uniforms.elapsed, time); gl.uniform1f(uniforms.impulse, reduceMotion.matches ? 0 : impulse); gl.drawArrays(gl.TRIANGLES, 0, 6); };
    const move = (event: PointerEvent) => { target.x = (event.clientX / window.innerWidth - 0.5) * 2; target.y = (event.clientY / window.innerHeight - 0.5) * 2; atmosphere?.style.setProperty("--pointer-x", `${target.x}`); atmosphere?.style.setProperty("--pointer-y", `${target.y}`); };
    const leave = () => { target.x = 0; target.y = 0; atmosphere?.style.setProperty("--pointer-x", "0"); atmosphere?.style.setProperty("--pointer-y", "0"); };
    const pulse = () => { impulse = 1; };
    picture.onload = () => { if (stopped) return; gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture); gl.uniform2f(uniforms.imageSize, picture.width, picture.height); resize(); ready = true; canvas.classList.add("is-ready"); frame = requestAnimationFrame(render); };
    picture.src = "/images/xiupu-scene-clean.png";
    const observer = new ResizeObserver(resize); observer.observe(canvas); window.addEventListener("pointermove", move, { passive: true }); document.documentElement.addEventListener("pointerleave", leave); window.addEventListener("xiupu:orb-pulse", pulse);
    return () => { stopped = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); window.removeEventListener("xiupu:orb-pulse", pulse); gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteShader(vertex); gl.deleteShader(fragment); gl.deleteProgram(program); };
  }, []);

  return <div className="atmosphere" aria-hidden="true"><div className="depth-mist depth-mist-back" /><div className="depth-mist depth-mist-front" /><div className="depth-glow" /><img className="scene-backdrop" src="/images/xiupu-scene-clean.png" alt="" fetchPriority="high" /><canvas ref={canvasRef} className="living-scene" /></div>;
}
