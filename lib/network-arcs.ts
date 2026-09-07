import {
  MercatorCoordinate,
  type Map as GLMap,
  type CustomLayerInterface,
} from 'maplibre-gl';
import type { NetworkNode, NetworkEdge } from './demo-network';
export function networkArcs(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  state: () => {
    selected: string | null;
    offline: Set<string>;
    motion: boolean;
  },
): CustomLayerInterface {
  let program: WebGLProgram | null = null,
    buffer: WebGLBuffer | null = null,
    vao: WebGLVertexArrayObject | null = null;
  const steps = 65;
  let vertices: Float32Array;
  let projection: WebGLUniformLocation | null,
    color: WebGLUniformLocation | null,
    size: WebGLUniformLocation | null,
    point: WebGLUniformLocation | null;
  return {
    id: 'demo-network-arcs',
    type: 'custom',
    renderingMode: '3d',
    onAdd(map: GLMap, gl: WebGL2RenderingContext) {
      const shader = (type: number, source: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          const message = gl.getShaderInfoLog(s);
          gl.deleteShader(s);
          throw Error(message || 'Network shader failed');
        }
        return s;
      };
      const vs = shader(
        gl.VERTEX_SHADER,
        '#version 300 es\nprecision highp float;in vec3 a_pos;uniform mat4 u_matrix;uniform float u_size;void main(){gl_Position=u_matrix*vec4(a_pos,1.);gl_PointSize=u_size;}',
      );
      const fs = shader(
        gl.FRAGMENT_SHADER,
        '#version 300 es\nprecision highp float;uniform vec4 u_color;uniform float u_point;out vec4 color;void main(){float a=u_color.a;if(u_point>0.5){float d=length(gl_PointCoord-vec2(.5))*2.;if(d>1.)discard;a*=pow(1.-d,1.4);}color=vec4(u_color.rgb*a,a);}',
      );
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw Error('Network shader link failed');
      const values: number[] = [];
      for (const edge of edges) {
        const a = nodes.find((n) => n.id === edge.from)!,
          b = nodes.find((n) => n.id === edge.to)!;
        const groundA =
            map.queryTerrainElevation({
              lng: a.coordinates[0],
              lat: a.coordinates[1],
            }) || 0,
          groundB =
            map.queryTerrainElevation({
              lng: b.coordinates[0],
              lat: b.coordinates[1],
            }) || 0;
        const lift = Math.min(
          420,
          Math.max(
            100,
            Math.hypot(
              a.coordinates[0] - b.coordinates[0],
              a.coordinates[1] - b.coordinates[1],
            ) * 20000,
          ),
        );
        for (let i = 0; i < steps; i++) {
          const p = i / (steps - 1),
            x = a.coordinates[0] + (b.coordinates[0] - a.coordinates[0]) * p,
            y = a.coordinates[1] + (b.coordinates[1] - a.coordinates[1]) * p,
            z =
              groundA +
              (groundB - groundA) * p +
              15 +
              Math.sin(Math.PI * p) * lift,
            c = MercatorCoordinate.fromLngLat({ lng: x, lat: y }, z);
          values.push(c.x, c.y, c.z);
        }
      }
      vertices = new Float32Array(values);
      buffer = gl.createBuffer();
      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      projection = gl.getUniformLocation(program, 'u_matrix');
      color = gl.getUniformLocation(program, 'u_color');
      size = gl.getUniformLocation(program, 'u_size');
      point = gl.getUniformLocation(program, 'u_point');
    },
    render(gl, options) {
      if (!program) return;
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(
        projection,
        false,
        options.defaultProjectionData.mainMatrix,
      );
      const s = state();
      edges.forEach((edge, i) => {
        const highlighted =
            !s.selected || edge.from === s.selected || edge.to === s.selected,
          failed = s.offline.has(edge.from) || s.offline.has(edge.to),
          opacity = highlighted ? 0.85 : 0.1;
        gl.uniform4f(
          color,
          ...((failed ? [1, 0.3, 0.48, opacity] : [0.2, 0.88, 1, opacity]) as [
            number,
            number,
            number,
            number,
          ]),
        );
        gl.uniform1f(point, 0);
        gl.uniform1f(size, 1);
        gl.drawArrays(gl.LINE_STRIP, i * steps, steps);
        gl.uniform1f(point, 1);
        gl.uniform1f(size, highlighted ? 7 : 3);
        gl.uniform4f(
          color,
          ...((failed
            ? [1, 0.3, 0.48, opacity * 0.45]
            : [0.2, 0.88, 1, opacity * 0.45]) as [
            number,
            number,
            number,
            number,
          ]),
        );
        gl.drawArrays(gl.POINTS, i * steps, steps);
        if (highlighted && !failed) {
          gl.uniform1f(size, 12);
          gl.uniform4f(color, 0.8, 1, 1, 1);
          const pulse = s.motion
            ? Math.floor(performance.now() / 45) % steps
            : 32;
          gl.drawArrays(gl.POINTS, i * steps + pulse, 1);
        }
      });
      gl.bindVertexArray(null);
    },
    onRemove(_map, gl) {
      if (buffer) gl.deleteBuffer(buffer);
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
      program = null;
    },
  };
}
