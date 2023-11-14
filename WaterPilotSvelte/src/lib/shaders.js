import { Vector3 } from 'three';

export const fresnel = {
	vertexShader: `
    varying vec3 vPositionW;
    varying vec3 vNormalW;
  
    


    void main() {
  
      vPositionW = vec3( vec4( position, 1.0 ) * modelMatrix);
      vNormalW = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ));
  
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
    } 
  `,
	fragmentShader: `
    varying vec3 vPositionW;
    varying vec3 vNormalW;
    uniform float u_opacity;
    uniform vec3 u_defaultColor;

  
    void main() {
          
      vec3 color = u_defaultColor;
      vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
      float fresnelTerm = dot(viewDirectionW, vNormalW) * (1. - u_opacity/5.);
      fresnelTerm = clamp(1.0 - fresnelTerm, 0., 1.);
  
      gl_FragColor = vec4( color * fresnelTerm, 1.) * u_opacity;
  
    }
  `
};
