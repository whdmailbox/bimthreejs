<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  msg: String
})

const count = ref(0);
onMounted(()=>{

});

</script>
<template>
  <div id="container" ></div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats  from 'three/examples/jsm/libs/stats.module.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'
// var material3d=new URL('');


let scene, renderer, camera,stats;
let model, skeleton, mixer, clock;

const crossFadeControls = [];

let idleAction, walkAction, runAction;
let idleWeight, walkWeight, runWeight;
let actions, settings;

let singleStepMode = false;
let sizeOfNextStep = 0;

export default {
  
  data(){
    return {
        message:'',
    };
  },
  mounted(){
    this.initSomeParas();
    // this.drawLine();
    this.addSoldier();
  },
  methods:{
    initSomeParas(){
      this.message="Walk or Run"
    },
    drawLine(){
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize( window.innerWidth, window.innerHeight );
      document.body.appendChild( renderer.domElement );

      const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
      camera.position.set( 0, 0, 100 );
      camera.lookAt( 0, 0, 0 );

      const scene = new THREE.Scene();
      const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
      const points = [];
      points.push( new THREE.Vector3( - 10, 0, 0 ) );
      points.push( new THREE.Vector3( 0, 10, 0 ) );
      points.push( new THREE.Vector3( 10, 0, 0 ) );

      const geometry = new THREE.BufferGeometry().setFromPoints( points );
      const line = new THREE.Line( geometry, material );
      scene.add( line );
      renderer.render( scene, camera );


    },
    addSoldier(){
      var that=this;
      const container = document.getElementById( 'container' );

			camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.set( 1, 2, - 3 );
				camera.lookAt( 0, 1, 0 );

				clock = new THREE.Clock();

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0xa0a0a0 );
				scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
				hemiLight.position.set( 0, 20, 0 );
				scene.add( hemiLight );

				const dirLight = new THREE.DirectionalLight( 0xffffff );
				dirLight.position.set( - 3, 10, - 10 );
				dirLight.castShadow = true;
				dirLight.shadow.camera.top = 2;
				dirLight.shadow.camera.bottom = - 2;
				dirLight.shadow.camera.left = - 2;
				dirLight.shadow.camera.right = 2;
				dirLight.shadow.camera.near = 0.1;
				dirLight.shadow.camera.far = 40;
				scene.add( dirLight );

				// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

				// ground

				const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
				mesh.rotation.x = - Math.PI / 2;
				mesh.receiveShadow = true;
				scene.add( mesh );

				const loader = new GLTFLoader();
				loader.load( './assets/model/Soldier.glb', function ( gltf ) {

					model = gltf.scene;
					scene.add( model );

					model.traverse( function ( object ) {

						if ( object.isMesh ) object.castShadow = true;

					} );

					//

					skeleton = new THREE.SkeletonHelper( model );
					skeleton.visible = false;
					scene.add( skeleton );

					//

					that.createPanel();


					//

					const animations = gltf.animations;

					mixer = new THREE.AnimationMixer( model );

					idleAction = mixer.clipAction( animations[ 0 ] );
					walkAction = mixer.clipAction( animations[ 3 ] );
					runAction = mixer.clipAction( animations[ 1 ] );

					actions = [ idleAction, walkAction, runAction ];

					that.activateAllActions();

					that.animate();

				} );

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.outputEncoding = THREE.sRGBEncoding;
				renderer.shadowMap.enabled = true;
				container.appendChild( renderer.domElement );

				stats = new Stats();
				container.appendChild( stats.dom );

				window.addEventListener( 'resize', that.onWindowResize );
    },
      createPanel() {
        var that=this;

				const panel = new GUI( { width: 310 } );

				const folder1 = panel.addFolder( 'Visibility' );
				const folder2 = panel.addFolder( 'Activation/Deactivation' );
				const folder3 = panel.addFolder( 'Pausing/Stepping' );
				const folder4 = panel.addFolder( 'Crossfading' );
				const folder5 = panel.addFolder( 'Blend Weights' );
				const folder6 = panel.addFolder( 'General Speed' );

				settings = {
					'show model': true,
					'show skeleton': false,
					'deactivate all': that.deactivateAllActions,
					'activate all': that.activateAllActions,
					'pause/continue': that.pauseContinue,
					'make single step': that.toSingleStepMode,
					'modify step size': 0.05,
					'from walk to idle': function () {

						that.prepareCrossFade( walkAction, idleAction, 1.0 );

					},
					'from idle to walk': function () {

						that.prepareCrossFade( idleAction, walkAction, 0.5 );

					},
					'from walk to run': function () {

						that.prepareCrossFade( walkAction, runAction, 2.5 );

					},
					'from run to walk': function () {

						that.prepareCrossFade( runAction, walkAction, 5.0 );

					},
					'use default duration': true,
					'set custom duration': 3.5,
					'modify idle weight': 0.0,
					'modify walk weight': 1.0,
					'modify run weight': 0.0,
					'modify time scale': 1.0
				};

				folder1.add( settings, 'show model' ).onChange( that.showModel );
				folder1.add( settings, 'show skeleton' ).onChange( that.showSkeleton );
				folder2.add( settings, 'deactivate all' );
				folder2.add( settings, 'activate all' );
				folder3.add( settings, 'pause/continue' );
				folder3.add( settings, 'make single step' );
				folder3.add( settings, 'modify step size', 0.01, 0.1, 0.001 );
				crossFadeControls.push( folder4.add( settings, 'from walk to idle' ) );
				crossFadeControls.push( folder4.add( settings, 'from idle to walk' ) );
				crossFadeControls.push( folder4.add( settings, 'from walk to run' ) );
				crossFadeControls.push( folder4.add( settings, 'from run to walk' ) );
				folder4.add( settings, 'use default duration' );
				folder4.add( settings, 'set custom duration', 0, 10, 0.01 );
				folder5.add( settings, 'modify idle weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

					that.setWeight( idleAction, weight );

				} );
				folder5.add( settings, 'modify walk weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

					that.setWeight( walkAction, weight );

				} );
				folder5.add( settings, 'modify run weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

					that.setWeight( runAction, weight );

				} );
				folder6.add( settings, 'modify time scale', 0.0, 1.5, 0.01 ).onChange( that.modifyTimeScale );

				folder1.open();
				folder2.open();
				folder3.open();
				folder4.open();
				folder5.open();
				folder6.open();

			},
      showModel( visibility ) {

				model.visible = visibility;

			},


			showSkeleton( visibility ) {

				skeleton.visible = visibility;

			},


			modifyTimeScale( speed ) {

				mixer.timeScale = speed;

			},


		  deactivateAllActions() {

				actions.forEach( function ( action ) {

					action.stop();

				} );

			},

			activateAllActions() {
        var that=this;
				that.setWeight( idleAction, settings[ 'modify idle weight' ] );
				that.setWeight( walkAction, settings[ 'modify walk weight' ] );
				that.setWeight( runAction, settings[ 'modify run weight' ] );

				actions.forEach( function ( action ) {

					action.play();

				} );

			},

			pauseContinue() {
        var that=this;
				if ( singleStepMode ) {

					singleStepMode = false;
					that.unPauseAllActions();

				} else {

					if ( idleAction.paused ) {

						that.unPauseAllActions();

					} else {

						that.pauseAllActions();

					}

				}

			},

			pauseAllActions() {

				actions.forEach( function ( action ) {

					action.paused = true;

				} );

			},

			unPauseAllActions() {

				actions.forEach( function ( action ) {

					action.paused = false;

				} );

			},

		  toSingleStepMode() {

				this.unPauseAllActions();

				singleStepMode = true;
				sizeOfNextStep = settings[ 'modify step size' ];

			},

			prepareCrossFade( startAction, endAction, defaultDuration ) {

				// Switch default / custom crossfade duration (according to the user's choice)

				const duration = this.setCrossFadeDuration( defaultDuration );

				// Make sure that we don't go on in singleStepMode, and that all actions are unpaused

				singleStepMode = false;
				this.unPauseAllActions();

				// If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
				// else wait until the current action has finished its current loop

				if ( startAction === idleAction ) {

					this.executeCrossFade( startAction, endAction, duration );

				} else {

					this.synchronizeCrossFade( startAction, endAction, duration );

				}

			},

			setCrossFadeDuration( defaultDuration ) {

				// Switch default crossfade duration <-> custom crossfade duration

				if ( settings[ 'use default duration' ] ) {

					return defaultDuration;

				} else {

					return settings[ 'set custom duration' ];

				}

			},

			synchronizeCrossFade( startAction, endAction, duration ) {
        var that=this;

				mixer.addEventListener( 'loop', onLoopFinished );

				function onLoopFinished( event ) {

					if ( event.action === startAction ) {

						mixer.removeEventListener( 'loop', onLoopFinished );

						that.executeCrossFade( startAction, endAction, duration );

					}

				}

			},

			executeCrossFade( startAction, endAction, duration ) {

				// Not only the start action, but also the end action must get a weight of 1 before fading
				// (concerning the start action this is already guaranteed in this place)

				this.setWeight( endAction, 1 );
				endAction.time = 0;

				// Crossfade with warping - you can also try without warping by setting the third parameter to false

				startAction.crossFadeTo( endAction, duration, true );

			},

			// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
			// the start action's timeScale to ((start animation's duration) / (end animation's duration))

			setWeight( action, weight ) {

				action.enabled = true;
				action.setEffectiveTimeScale( 1 );
				action.setEffectiveWeight( weight );

			},

			// Called by the render loop

			updateWeightSliders() {

				settings[ 'modify idle weight' ] = idleWeight;
				settings[ 'modify walk weight' ] = walkWeight;
				settings[ 'modify run weight' ] = runWeight;

			},

			// Called by the render loop

			updateCrossFadeControls() {

				if ( idleWeight === 1 && walkWeight === 0 && runWeight === 0 ) {

					crossFadeControls[ 0 ].disable();
					crossFadeControls[ 1 ].enable();
					crossFadeControls[ 2 ].disable();
					crossFadeControls[ 3 ].disable();

				}

				if ( idleWeight === 0 && walkWeight === 1 && runWeight === 0 ) {

					crossFadeControls[ 0 ].enable();
					crossFadeControls[ 1 ].disable();
					crossFadeControls[ 2 ].enable();
					crossFadeControls[ 3 ].disable();

				}

				if ( idleWeight === 0 && walkWeight === 0 && runWeight === 1 ) {

					crossFadeControls[ 0 ].disable();
					crossFadeControls[ 1 ].disable();
					crossFadeControls[ 2 ].disable();
					crossFadeControls[ 3 ].enable();

				}

			},

			onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			},

			animate() {

				// Render loop

				requestAnimationFrame( this.animate );

				idleWeight = idleAction.getEffectiveWeight();
				walkWeight = walkAction.getEffectiveWeight();
				runWeight = runAction.getEffectiveWeight();

				// Update the panel values if weights are modified from "outside" (by crossfadings)

				this.updateWeightSliders();

				// Enable/disable crossfade controls according to current weight values

				this.updateCrossFadeControls();

				// Get the time elapsed since the last frame, used for mixer update (if not in single step mode)

				let mixerUpdateDelta = clock.getDelta();

				// If in single step mode, make one step and then do nothing (until the user clicks again)

				if ( singleStepMode ) {

					mixerUpdateDelta = sizeOfNextStep;
					sizeOfNextStep = 0;

				}

				// Update the animation mixer, the stats panel, and render this frame

				mixer.update( mixerUpdateDelta );

				stats.update();

				renderer.render( scene, camera );

			}


  }
}
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
