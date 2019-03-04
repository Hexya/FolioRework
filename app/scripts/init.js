import Sound from './Sound.js';
let OrbitControls = require('three-orbit-controls')(THREE)
import soundFile from '../assets/sound/ambiantSound.mp3';
import objFile from '../assets/models/Concrete_Wall_01.obj';
import fontFile from '../assets/fonts/Avenir.json';
import RundFromLove from '../assets/img/project/RunFromLoveScreen.png';
import SabineExp from '../assets/img/project/SabineScreen.png';
import canvasSound from '../assets/img/project/CanvasSoundScreen.png';
import DataViz from '../assets/img/project/DataVizScreen.png';
import {TweenMax, Power2, TimelineLite} from "gsap/TweenMax";

import 'three/examples/js/postprocessing/EffectComposer';
import 'three/examples/js/postprocessing/RenderPass';
import 'three/examples/js/postprocessing/ShaderPass';
import 'three/examples/js/shaders/CopyShader'
import 'three/examples/js/shaders/DotScreenShader'
import 'three/examples/js/shaders/LuminosityHighPassShader';
import 'three/examples/js/postprocessing/UnrealBloomPass';
import 'three/examples/js/shaders/FXAAShader.js';

import * as dat from 'dat.gui';
import { TimelineMax, Power4 } from 'gsap';

let Stats = require('stats-js')
let clock = new THREE.Clock();
let composer, renderPass, effect, shaderPass, bloomPass, chromaticAberration, chromaticAberrationPass, chromaticAberrationFrag;
let params = {
    exposure: 0,
    bloomStrength: 1,

    bloomThreshold: 0,
    bloomRadius: .5
};


// TODO : add Dat.GUI
// TODO : add Stats

class LoadSound {
    constructor() {
        this.sound = new Sound(soundFile,125,0,this.startSound.bind(this),false)
    }
    startSound() {
        //this.sound.play();
    }
}

export default class App {

    constructor() {
        // Raycaster
        this.raycaster = new THREE.Raycaster();
        this.intersects = [];
        this.mouse = new THREE.Vector2();

        // Stats
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.stats.domElement.style.left = '0px';
        document.body.appendChild( this.stats.domElement );

        // SOUND
        this.play = new LoadSound();

        //THREE SCENE
        this.container = document.querySelector( '#main' );
        document.body.appendChild( this.container );

        this.camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 10000 );
        this.camera.position.y = 95;
        //this.camera.position.z = 30; => no postproc
        this.camera.position.z = 55;
        this.controls = new OrbitControls(this.camera) // ==> HERE

        this.scene = new THREE.Scene();


        let loader = new THREE.OBJLoader();
        loader.load( objFile, ( modelObj )=> {
                modelObj.traverse( function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshPhongMaterial({color: 0xfafbfc, specular: 0xf00, shininess: 100,});
                        child.castShadow = true; //default is false
                        child.receiveShadow = true; //default is false
                        //console.log(child.name)

                        child.scale.set(1.5,1.5,1.5);

                        switch (child.name) {
                            case "Réseau_d'atomes.5":
                                child.material = new THREE.MeshStandardMaterial( { color: 0x414141, emissive:0x0, roughness: 0.29, metalness: 1} )
                                break;
                            case "Fracture_Voronoï.2":
                                child.material = new THREE.MeshStandardMaterial( { color: 0x414141, emissive:0x0, roughness: 0.29, metalness: 1} )
                                break;
                        }
                    }
                })
                this.scene.add( modelObj );
                //console.log(modelObj)
                modelObj.scale.set(.08,.08,.08)
                //modelObj.children[1].material = new THREE.MeshPhongMaterial( { color: 0x0, emissive:0x0, specular:0xffffff, shininess: 10 } )

                this.parameters(modelObj, this.dirLight);
                this.scrollAnim(modelObj);
                // Remove Loader
                this.loaded();
            },
            (xhr) => {
                //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                let percent = (xhr.loaded / xhr.total * 100);
                document.querySelector('.load-progress').innerHTML = Math.floor(percent) +'%';
                //document.querySelector('.loader .loaded-svg').style.height = Math.floor(percent) + 'px';
            },
            (error) => {
                console.log( 'An error happened' );
            }
        );
        //TEXT
        let fontLoads = new THREE.FontLoader();
        fontLoads.load( fontFile, ( font ) => {
            this.titleText = new THREE.TextGeometry( 'L  O  I  C    B  E  L  A  I  D   -   R  E  M  E  S  A  L', {font: font, size: 5, height: 1,} );
            this.fontMat = new THREE.MeshBasicMaterial({ color: 0xFFB73A });
            this.fontMesh = new THREE.Mesh(this.titleText, this.fontMat);
            this.scene.add( this.fontMesh );
            this.fontMesh.position.set(-70,107,-150);
        } );

        //PLANE
        //this.planeGeometry();
        this.planeGroup = new THREE.Group();
        for(let i=0; i<5; i++) {
            this.planeGeometry('planeNumber'+i, i);
        }
        this.planePosition();



        //LIGHT
        this.dirLight = new THREE.DirectionalLight( 0xffffff, 8 );//Power light
        this.dirLight.castShadow = true;
        this.dirLight.position.set(0,20,-50);
        this.scene.add(this.dirLight);

        this.dirLightHelper = new THREE.DirectionalLightHelper( this.dirLight, 10 );
        this.scene.add( this.dirLightHelper );

        this.baseLight = new THREE.DirectionalLight( 0xffffff, 6 );//Power light
        this.baseLight.castShadow = true;
        this.baseLight.position.set(50,0,-50);
        this.scene.add(this.baseLight);

        this.baseLightHelper = new THREE.DirectionalLightHelper( this.baseLight, 1 );
        this.scene.add( this.baseLightHelper );

        //RENDERER
        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha:true } );
        //this.renderer.setClearColor( '0x0' );
        this.renderer.setClearColor( 0x22aa01, 0 );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );

        this.renderer.setAnimationLoop( this.render.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.addComposer();

        this.onWindowResize();

        //window.addEventListener( 'mousemove', this.onMouseMove, false );
        document.querySelector('canvas').addEventListener( 'mousemove', this.onMouseMove.bind(this), false );

    }

    onMouseMove( event ) {
        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        //console.log(this.scene.children)
        for ( var i = 0; i < this.scene.children.length; i++ ) {
            //this.scene.children[ i ].material.opacity = 0.2; // ==> ON MOUSE MOOVE
        }
    }

    planeGeometry(planeNumber, i) {
        let planeGeo = new THREE.PlaneBufferGeometry( 45, 25, 32 );
        let planeMat = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, transparent:true, opacity: 0.3} ); // 0.2 to SEE
        planeNumber = new THREE.Mesh( planeGeo, planeMat );
        planeNumber.name = 'Plane'+i;

        this.planeGroup.add(planeNumber);
        this.scene.add(this.planeGroup);
    }
    planePosition() {
        //DEPART ESTATE
        this.scene.getObjectByName('Plane0').material.map = new THREE.TextureLoader().load( RundFromLove );
        //this.scene.getObjectByName('Plane0').material.color.set( 0xaaaa00 )// Yellow
        this.scene.getObjectByName('Plane0').position.set(-13,20,-1);
        this.scene.getObjectByName('Plane1').material.map = new THREE.TextureLoader().load( SabineExp );
        this.scene.getObjectByName('Plane1').position.set(15,-12,-1);
        this.scene.getObjectByName('Plane2').material.map = new THREE.TextureLoader().load( canvasSound );
        this.scene.getObjectByName('Plane2').position.set(-9,-42,-1);
        this.scene.getObjectByName('Plane3').material.map = new THREE.TextureLoader().load( DataViz );
        this.scene.getObjectByName('Plane3').position.set(3,-75,-1);
        this.scene.getObjectByName('Plane4').material.map = new THREE.TextureLoader().load( canvasSound );
        this.scene.getObjectByName('Plane4').position.set(-15,-112,-1);
    }
    scrollAnim(modelObj) {
        let tl = new TimelineLite();
        tl.add('intro')
            //.to(this.scene.getObjectByName('Plane0').position, 2 , { y:97, ease:Circ.easeInOut, useFrames:true})
            .to(this.planeGroup.position, 2 , { y:77, ease:Circ.easeInOut, useFrames:true})
            .to(this.scene.getObjectByName('Plane0').material, 2 , { opacity: 1, ease:Circ.easeInOut, useFrames:true}, '-=1')
            .to(this.fontMesh.material.color, 2 , { r: 0, g: 0, b: 0, ease:Expo.easeInOut, useFrames:true}, '-=3')
            .to(modelObj.position, 2, {x: 0,y:77, ease:Circ.easeInOut, useFrames:true}, 'intro')
            .addPause()
            .add('step1')
            .to(this.scene.getObjectByName('Plane0').material, 2 , { opacity: 0, ease:Circ.easeInOut, useFrames:true})
            .to(this.planeGroup.position, 2 , { y:105, ease:Circ.easeInOut, useFrames:true}, '-=2')
            .to(this.scene.getObjectByName('Plane1').material, 2 , { opacity: 0.5, ease:Circ.easeInOut, useFrames:true}, '-=1.8')
            .to(modelObj.position, 2, {x: 0,y:105, ease:Circ.easeInOut, useFrames:true}, 'step1')
            .addPause()
            .add('step2')
            .to(this.scene.getObjectByName('Plane1').material, 2 , { opacity: 0, ease:Circ.easeInOut, useFrames:true})
            .to(this.planeGroup.position, 2 , { y:140, ease:Circ.easeInOut, useFrames:true}, '-=2')
            .to(this.scene.getObjectByName('Plane2').material, 2 , { opacity: 1, ease:Circ.easeInOut, useFrames:true}, '-=1.5')
            .to(modelObj.position, 2, {x: 0,y:140, ease:Circ.easeInOut, useFrames:true}, 'step2')
            .addPause()
            .add('step3')
            .to(this.scene.getObjectByName('Plane2').material, 2 , { opacity: 0, ease:Circ.easeInOut, useFrames:true})
            .to(this.planeGroup.position, 2 , { y:170, ease:Circ.easeInOut, useFrames:true}, '-=2')
            .to(this.scene.getObjectByName('Plane3').material, 2 , { opacity: 1, ease:Circ.easeInOut, useFrames:true}, '-=1.5')
            .to(modelObj.position, 2, {x: 0,y:170, ease:Circ.easeInOut, useFrames:true}, 'step3')
            .addPause()
            .add('step4')
            .to(this.scene.getObjectByName('Plane3').material, 2 , { opacity: 0, ease:Circ.easeInOut, useFrames:true})
            .to(this.planeGroup.position, 2 , { y:210, ease:Circ.easeInOut, useFrames:true}, '-=2')
            .to(this.scene.getObjectByName('Plane4').material, 2 , { opacity: 1, ease:Circ.easeInOut, useFrames:true}, '-=1.5')
            .to(modelObj.position, 2, {x: 0,y:210, ease:Circ.easeInOut, useFrames:true}, 'step4')
            .addPause()
            .pause();

        document.querySelector('.gsap-btn').addEventListener('click',()=> {
            tl.play();
        })
        document.querySelector('.gsap-btn-back').addEventListener('click',()=> {
            tl.reverse();
        })
    }

    loaded() {
        document.querySelector('.loader').classList.add('remove-scene')
        setTimeout(()=> {
            document.querySelector('.loader').remove();
        },500)
    }

    //REQUEST ANIMATION LOOP
    render() {
        this.stats.begin()

        //RAYCASTER
        this.raycaster.setFromCamera( this.mouse, this.camera );
        // calculate objects intersecting the picking ray
        this.intersects = this.raycaster.intersectObjects( this.scene.children );

        for ( var i = 0; i < this.intersects.length; i++ ) {
            //console.log(this.intersects)
            //this.intersects[ i ].object.material.opacity = 1; //  ==> ON HOVER
            //console.log(this.intersects[i])
        }


        let time = Date.now()/1000;// rayon
        this.dirLight.position.x += Math.cos(time)/2;
        this.dirLight.position.y += Math.sin(time)/2;
        //this.dirLight.position.z += Math.tan(time);

        this.baseLight.position.x -= Math.cos(time)/2;
        this.baseLight.position.y -= Math.sin(time)/2;

        //RENDER
        //this.renderer.render( this.scene, this.camera ); //Default
        composer.render();
        this.stats.end();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    parameters(modelObj,light) {
        //Gui
        //console.log(modelObj)
        let gui = new dat.GUI();

        let Meshes = gui.addFolder('Meshes');
        let poslight = Meshes.addFolder('Light');
        poslight.add(light.position, 'x', -500, 500).listen();
        poslight.add(light.position, 'y', -500, 500).listen();
        poslight.add(light.position, 'z', -500, 500).listen();
        let grpElem = Meshes.addFolder('Group');
        let grpPos = grpElem.addFolder('Group Position');
        grpPos.add(modelObj.position, 'x', -500, 500).listen();
        grpPos.add(modelObj.position, 'y', -500, 500).listen();
        grpPos.add(modelObj.position, 'z', -500, 500).listen();
        let grpScale = grpElem.addFolder('Group Scale');
        grpScale.add(modelObj.scale, 'x', 0, 5).listen();
        grpScale.add(modelObj.scale, 'y', 0, 5).listen();
        grpScale.add(modelObj.scale, 'z', 0, 5).listen();
        let grpRot = grpElem.addFolder('Group Rotation');
        grpRot.add(modelObj.rotation, 'x', 0, 5).listen();
        grpRot.add(modelObj.rotation, 'y', 0, 5).listen();
        grpRot.add(modelObj.rotation, 'z', 0, 5).listen();
    }

    addComposer() {
        //composer
        composer = new THREE.EffectComposer(this.renderer);

        //passes
        renderPass = new THREE.RenderPass(this.scene, this.camera);

        chromaticAberration = {
            uniforms: {
                tDiffuse: { type: "t", value: null },
                resolution: {
                    value: new THREE.Vector2(
                        window.innerWidth * window.devicePixelRatio,
                        window.innerHeight * window.devicePixelRatio
                    )
                },
                power: { value: 0.5 }
            },

            vertexShader: `
    
        varying vec2 vUv;
    
        void main() {
    
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
        }
        `,

            fragmentShader: `
			uniform sampler2D tDiffuse;
			uniform vec2 resolution;

			vec2 barrelDistortion(vec2 coord, float amt) {
				vec2 cc = coord - 0.5;
				float dist = dot(cc, cc);
				return coord + cc * dist * amt;
			}

			float sat( float t )
			{
				return clamp( t, 0.0, 1.0 );
			}

			float linterp( float t ) {
				return sat( 1.0 - abs( 2.0*t - 1.0 ) );
			}

			float remap( float t, float a, float b ) {
				return sat( (t - a) / (b - a) );
			}

			vec4 spectrum_offset( float t ) {
				vec4 ret;
				float lo = step(t,0.5);
				float hi = 1.0-lo;
				float w = linterp( remap( t, 1.0/6.0, 5.0/7.0 ) );
				ret = vec4(lo,1.0,hi, 1.) * vec4(1.0-w, w, 1.0-w, 1.);

				return pow( ret, vec4(1.0/2.2) );
			}

			const float max_distort = .5;
			const int num_iter = 12;
			const float reci_num_iter_f = 1.0 / float(num_iter);

			void main()
			{	
				vec2 uv=(gl_FragCoord.xy/resolution.xy*.5)+.25;

				vec4 sumcol = vec4(0.0);
				vec4 sumw = vec4(0.0);	
				for ( int i=0; i<num_iter;++i )
				{
					float t = float(i) * reci_num_iter_f;
					vec4 w = spectrum_offset( t );
					sumw += w;
					sumcol += w * texture2D( tDiffuse, barrelDistortion(uv, .6 * max_distort*t ) );
				}

				gl_FragColor = sumcol / sumw;
			}
      `
        };
        //DEFAULT
        //const float max_distort = 2.2;

        chromaticAberrationPass = new THREE.ShaderPass(chromaticAberration);

        bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,
            0.4,
            0.85
        );
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;

        let antialiasPass = new THREE.ShaderPass(THREE.FXAAShader);

        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        composer.addPass(chromaticAberrationPass);
        composer.addPass(antialiasPass);
        antialiasPass.renderToScreen = true;
    }
}