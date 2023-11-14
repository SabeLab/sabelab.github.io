<script>
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/orbitcontrols';
	import { onMount } from 'svelte';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
	import { fresnel } from '$lib/shaders.js';

	onMount(async () => {
		THREE.ColorManagement.enabled = true;

		var defaultColor = new THREE.Color(0.612, 0.667, 1);
		var hoverColor = new THREE.Color(0.36, 0.72, 0.9);

		window.addEventListener('resize', myResize);

		//scene
		const scene = new THREE.Scene();

		let arisModel = [];
		// Instantiate a loader
		var loader = new GLTFLoader();

		// Optional: Provide a DRACOLoader instance to decode compressed mesh data
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
		loader.setDRACOLoader(dracoLoader);

		const [gltf] = await Promise.all([
			//Load gltf
			loader.loadAsync('GLTF/ArisPilot/ArisGLTF_Merged2.glb')
		]);

		scene.add(gltf.scene);
		arisModel = gltf.scene;

		//axeshelper
		const worldAxes = new THREE.AxesHelper(1);
		scene.add(worldAxes);

		//fresnelmaterial
		const fresMat = new THREE.ShaderMaterial({
			uniforms: {
				u_opacity: { value: 1 },
				u_defaultColor: { value: defaultColor }
			},
			vertexShader: fresnel.vertexShader,
			fragmentShader: fresnel.fragmentShader
		});

		const hoverfresMat = new THREE.ShaderMaterial({
			uniforms: {
				u_opacity: { value: 1 },
				u_defaultColor: { value: hoverColor }
			},
			vertexShader: fresnel.vertexShader,
			fragmentShader: fresnel.fragmentShader
		});

		//Traverse the model and apply the PBR material to all mesh objects
		arisModel.traverse((child) => {
			if (child.isMesh) {
				child.material = fresMat;
			}
		});
		//traverse the model and set userData
		arisModel.traverse((child) => {
			if (child.isMesh) {
				child.userData = {};
			}
		});

		//camera
		const myAspect = window.innerWidth / window.innerHeight;
		const camera = new THREE.PerspectiveCamera(35, myAspect);
		camera.position.set(35, 40, 120);
		scene.add(camera);

		//ambient light
		scene.add(new THREE.AmbientLight('#7b7b7b'));

		//LIGHT RECT
		const light = new THREE.RectAreaLight(0xffffff, 30, 250);
		light.position.set(-15, 100, 45);
		light.lookAt(-15, 0, 45);
		scene.add(light);

		const sizes = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		//renderer
		const canvas = document.querySelector('.webgl');
		const renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			antialias: true,
			alpha: true
		});
		/* renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping; */
		renderer.setSize(window.innerWidth, window.innerHeight);

		//RESIZE
		function myResize() {
			sizes.width = window.innerWidth;
			sizes.height = window.innerHeight;
			camera.aspect = sizes.width / sizes.height;
			camera.updateProjectionMatrix();
			renderer.setSize(sizes.width, sizes.height);
		}

		//MOUSE MOVE
		const mouse = new THREE.Vector2();

		window.addEventListener('mousemove', (event) => {
			mouse.x = (event.clientX / sizes.width) * 2 - 1;
			mouse.y = -(event.clientY / sizes.height) * 2 + 1;
		});

		//ORBITCONTROLS
		const controls = new OrbitControls(camera, canvas);
		controls.enableDamping = true;
		controls.maxDistance = 210;
		controls.maxPolarAngle = Math.PI / 2.4;
		controls.target = new THREE.Vector3(-15, 0, 45);

		// clock
		const clock = new THREE.Clock();

		var mouseEnter = false;

		var currentIntersect = null;

		const mouseover = () => {
			if (intersects.length) {
				if (currentIntersect === null) {
					console.log('mouse enter');
					mouseEnter = true;
					console.log(mouseEnter);
				}
				currentIntersect = intersects[0];
			} else {
				if (currentIntersect) {
					console.log('mouse leave');
					mouseEnter = false;
					console.log(mouseEnter);
				}
				currentIntersect = null;
			}
		};

		//raycaster
		var raycaster = new THREE.Raycaster();

		var intersects = [];

		const hovercolor = () => {
			raycaster.setFromCamera(mouse, camera);
			intersects = raycaster.intersectObject(arisModel, true);

			if (intersects.length > 0 && mouseEnter === true) {
				intersects[0].object.material = hoverfresMat;
				//console.log(intersects[0]);
			} else {
				arisModel.traverse((child) => {
					if (child.isMesh) {
						child.material = fresMat;
					}
				});
			}
		};

		/* 		//CLICK
		window.addEventListener('click', () => {
			//update raycaster
			raycaster.setFromCamera(mouse, camera);
			intersects = raycaster.intersectObject(arisModel, true);
			mouseEnter = false;
			
			if (intersects.length > 0) {
				
				intersects[0].object.material = hoverfresMat
			
				//console.log(intersects[0]);
			}
		}); */

		/* 
			//MOUSE UP SCALE BACK TO ORIGINAL
			window.addEventListener('mouseup', () => {
			//update raycaster
			raycaster.setFromCamera(mouse, camera);
			intersects = raycaster.intersectObject(arisModel, true);

			if (intersects.length > 0) {
				//restore original scale
				intersects[0].object.scale.copy(intersects[0].object.userData.originalScale);
			}
		}); */

		// ANIM
		const tick = () => {
			raycaster.setFromCamera(mouse, camera);
			intersects = raycaster.intersectObject(arisModel, true);

			// clock
			const elapsedTime = clock.getElapsedTime();

			//raycaster - mouse enter mouse leave
			mouseover();
			hovercolor();
			// Update Objects
			controls.update();

			// render
			renderer.render(scene, camera);

			window.requestAnimationFrame(tick);
		};
		tick();
	});
</script>

<canvas class="webgl" />
