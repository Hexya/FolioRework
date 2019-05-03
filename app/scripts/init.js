import Sound from './Sound.js';
let OrbitControls = require('three-orbit-controls')(THREE)
let FBXLoader = require('three-fbx-loader');
import soundFile from '../assets/sound/ambiantSound.mp3';
//import objFile from '../assets/models/Concrete_Wall_Fir.obj';
//import objFile from '../assets/models/plz.obj';
import objFile from '../assets/models/modelObj.obj';
//import objFile from '../assets/models/modelObjMap.obj';
import fontFile from '../assets/fonts/Avenir.json';
import RundFromLove from '../assets/img/project/RunFromLoveScreen.png';
import SabineExp from '../assets/img/project/SabineScreen.png';
import canvasSound from '../assets/img/project/CanvasSoundScreen.png';
import low from '../assets/img/project/low.png';
import DataViz from '../assets/img/project/DataVizScreen.png';
import {TweenMax, Power2, TimelineLite} from 'gsap/TweenMax';
import { getPerspectiveSize } from './utils/3d';
import { GLTFLoader } from 'three/examples/js/loaders/GLTFLoader';

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
    bloomRadius: .4
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

        this.index = 0

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
        this.camera.position.y = 0;
        //this.camera.position.z = 30; => no postproc
        this.camera.position.z = 55;
        this.controls = new OrbitControls(this.camera) // ==> ORBITCONTROLS HERE

        this.scene = new THREE.Scene();

        this.wallLoader();

        //TEXT
        let fontLoads = new THREE.FontLoader();
        fontLoads.load( fontFile, ( font ) => {
            this.titleText = new THREE.TextGeometry( 'L  O  I  C    B  E  L  A  I  D   -   R  E  M  E  S  A  L', {font: font, size: 5, height: 1,} );
            this.fontMat = new THREE.MeshBasicMaterial({ color: 0xFFB73A ,transparent:true});
            this.fontMesh = new THREE.Mesh(this.titleText, this.fontMat);
            this.scene.add( this.fontMesh );
            this.fontMesh.position.set(-70,17,-80);
        } );

        /*//PLANE
        //this.planeGeometry();
        this.planeGroup = new THREE.Group();
        for(let i=0; i<5; i++) {
            this.planeGeometry('planeNumber'+i, i);
        }
        this.planePosition();*/
        this.planeGroup = new THREE.Group();


        //LIGHT
        this.dirLight = new THREE.DirectionalLight( 0xffffff, 8 );//Power light
        this.dirLight.castShadow = true;
        this.dirLight.position.set(0,-150,-50);
        this.scene.add(this.dirLight);

        this.dirLightHelper = new THREE.DirectionalLightHelper( this.dirLight, 10 );
        this.scene.add( this.dirLightHelper );

        this.targetObject = new THREE.Object3D();
        this.scene.add(this.targetObject);
        this.targetObject.position.y = -150;

        this.dirLight.target = this.targetObject;

        this.baseLight = new THREE.DirectionalLight( 0xffffff, 6 );//Power light
        this.baseLight.castShadow = true;
        this.baseLight.position.set(50,-60,-50);
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
        //window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.addComposer();

        //window.addEventListener( 'mousemove', this.onMouseMove, false );
        document.querySelector('canvas').addEventListener( 'mousemove', this.onMouseMove.bind(this), false );

        this.addEvents()

    }

    wallLoader() {
        this.groupWall = new THREE.Group();
        let wallLoader = new THREE.OBJLoader();
        wallLoader.load( objFile, ( modelObj )=> {
                modelObj.traverse( function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshPhongMaterial({color: 0xfafbfc, specular: 0xf00, shininess: 100,});
                        child.castShadow = true; //default is false
                        child.receiveShadow = true; //default is false
                        //console.log(child.name)

                        child.scale.set(1.5,1.5,1.5);
                        console.log(child.name)
                        switch (child.name) {
                            case "Réseau_d'atomes.001":
                                child.material = new THREE.MeshStandardMaterial( { color: 0x414141, emissive:0x0, roughness: 0.29, metalness: 1} )
                                break;
                            case "Fracture_Voronoï.001":
                                child.material = new THREE.MeshStandardMaterial( { color: 0x414141, emissive:0x0, roughness: 0.29, metalness: 1} )
                                break;
                            case "Plane_Plane.000":
                                child.material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, transparent:true, opacity: 0.3} ); // 0.2 to SEE
                                child.material.map = new THREE.TextureLoader().load( low );
                                //console.log(child.material.map)
                                break;
                            case "Cube_Cube.000":
                                child.material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, transparent:true, opacity: 0.3} ); // 0.2 to SEE
                                child.material.map = new THREE.TextureLoader().load( low );
                                //console.log(child.material.map)
                                break;
                        }
                    }
                })
                this.box3 = new THREE.Box3().setFromObject(modelObj) //Max and min of object
                this.groupWall.add( modelObj );
                this.scene.add( this.groupWall );

                modelObj.position.y = this.box3.max.y * 0.5;
                //console.log(modelObj)
                //modelObj.scale.set(.08,.08,.08)
                //modelObj.children[1].material = new THREE.MeshPhongMaterial( { color: 0x0, emissive:0x0, specular:0xffffff, shininess: 10 } )

                this.parameters(modelObj, this.dirLight);
                //this.scrollAnim(modelObj);

                //PLANE
                for(let i=0; i<5; i++) {
                    this.planeGeometry('planeNumber'+i, i, modelObj);
                }
                this.planePosition();


                // Remove Loader
                this.loaded();
                this.modelObj = modelObj;
                this.onWindowResize()
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
    }

    addEvents() {
        document.querySelector('.gsap-btn').addEventListener('click',this.onNextClick.bind(this));
        document.querySelector('.gsap-btn-back').addEventListener('click',this.onPrevClick.bind(this));
    }

    onNextClick() {
        const index = (this.index + 1) %6;//NUMBER OF STEP
        this.goToIndex(index);
    }
    onPrevClick() {
        let index = (this.index - 1) %6;//NUMBER OF STEP
        if(index == -1) {
            index = this.index + 5;
        }
        this.goToIndex(index);
    }

    goToIndex(index) {
        this.index = index;
        const y = this.getWallPositionForIndex(index);
        TweenMax.to(this.groupWall.position, 2, { y, ease:Circ.easeInOut })

        //TEXT DISAPEAR
        if(index != 0) {
            TweenMax.to(this.fontMesh.material,2, { opacity: 0, ease:Circ.easeInOut})
        } else {
            TweenMax.to(this.fontMesh.material,2, { opacity: 1, ease:Circ.easeInOut})
        }
    }

    onMouseMove( event ) {
        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        //console.log(this.scene.children)
        for ( var i = 0; i < this.scene.children.length; i++ ) {
            //NOMRAL LIGHT ON MOOVE
            TweenMax.to(bloomPass, .3, {strength:1, ease:Sine.easeOut});
            chromaticAberration.uniforms.uDistortion.value = .5;
        }
    }

    planeGeometry(planeNumber, i) {
        let planeGeo = new THREE.PlaneBufferGeometry( 50, 30, 10 );
        let planeMat = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, transparent:true, opacity: 0.3} ); // 0.2 to SEE
        planeNumber = new THREE.Mesh( planeGeo, planeMat );
        planeNumber.name = 'Plane'+i;

        this.planeGroup.add(planeNumber);
        this.groupWall.add(this.planeGroup);
    }
    planePosition() {
        console.log(this.box3)
        const width = Math.abs(this.box3.min.x - this.box3.max.x)
        const height = Math.abs(this.box3.min.y - this.box3.max.y)
        const size = getPerspectiveSize(this.camera, this.camera.position.z); //Camera coord
        this.reScale = (size.width / (Math.abs(this.box3.max.x) + Math.abs(this.box3.min.x))) * 1.2;
        //DEPART ESTATE
        this.groupWall.getObjectByName('Plane0').material.map = new THREE.TextureLoader().load( RundFromLove );
        this.groupWall.getObjectByName('Plane0').scale.set(this.reScale*10.3, this.reScale*10.3, this.reScale*10.3)
        this.groupWall.getObjectByName('Plane0').position.set(-window.innerWidth/width*10,-10*(this.reScale*93),-1);
        this.groupWall.getObjectByName('Plane1').material.map = new THREE.TextureLoader().load( SabineExp );
        this.groupWall.getObjectByName('Plane1').scale.set(this.reScale*10.3, this.reScale*10.3, this.reScale*10.3)
        this.groupWall.getObjectByName('Plane1').position.set(window.innerWidth/width*10,-10*(this.reScale*133),-1);
        this.groupWall.getObjectByName('Plane2').material.map = new THREE.TextureLoader().load( canvasSound );
        this.groupWall.getObjectByName('Plane2').scale.set(this.reScale*10.35, this.reScale*10.35, this.reScale*10.35)
        this.groupWall.getObjectByName('Plane2').position.set(-window.innerWidth/width*6.5,-10*(this.reScale*171),-1);
        this.groupWall.getObjectByName('Plane3').material.map = new THREE.TextureLoader().load( DataViz );
        this.groupWall.getObjectByName('Plane3').scale.set(this.reScale*13, this.reScale*13, this.reScale*13)
        this.groupWall.getObjectByName('Plane3').position.set(window.innerWidth/width*3,-10*(this.reScale*211),-1);
        this.groupWall.getObjectByName('Plane4').material.map = new THREE.TextureLoader().load( canvasSound );
        this.groupWall.getObjectByName('Plane4').scale.set(this.reScale*10.35, this.reScale*10.35, this.reScale*10.35)
        this.groupWall.getObjectByName('Plane4').position.set(-window.innerWidth/width*12,-10*(this.reScale*258),-1);

        /*//DEPART ESTATE
        this.groupWall.getObjectByName('Plane0').material.map = new THREE.TextureLoader().load( RundFromLove );
        //this.scene.getObjectByName('Plane0').material.color.set( 0xaaaa00 )// Yellow
        //this.groupWall.getObjectByName('Plane0').position.set(width/-width*15,height/-height*107,-1);
        this.groupWall.getObjectByName('Plane0').position.set(-13,-85,-1);
        this.groupWall.getObjectByName('Plane1').material.map = new THREE.TextureLoader().load( SabineExp );
        this.groupWall.getObjectByName('Plane1').position.set(15,-117,-1);
        this.groupWall.getObjectByName('Plane2').material.map = new THREE.TextureLoader().load( canvasSound );
        this.groupWall.getObjectByName('Plane2').position.set(-9,-155,-1);
        this.groupWall.getObjectByName('Plane3').material.map = new THREE.TextureLoader().load( DataViz );
        this.groupWall.getObjectByName('Plane3').position.set(3,-190,-1);
        this.groupWall.getObjectByName('Plane4').material.map = new THREE.TextureLoader().load( canvasSound );
        this.groupWall.getObjectByName('Plane4').position.set(-15,-233,-1);*/
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
        this.intersects = this.raycaster.intersectObjects( this.planeGroup.children );
        document.body.style.cursor = "default";
        for ( let i = 0; i < this.intersects.length; i++ ) {
            //console.log(this.intersects)
            //POWER LIGHT ON HOVER
            TweenMax.to(bloomPass, .3, {strength:1.5, ease:Sine.easeOut});
            chromaticAberration.uniforms.uDistortion.value = 2.;
            document.body.style.cursor = "pointer";
            if(this.intersects.length != 0 && this.intersects[i].object.name == 'Plane'+i) {
                document.body.addEventListener('click', () => {
                    if(this.intersects.length != 0) {
                        console.log(this.intersects[i].object.name)
                    }
                })
            }
        }


        let time = Date.now()/1000;// rayon
        this.dirLight.position.x += Math.cos(time)/2;
        this.dirLight.position.y += Math.sin(time)/2;
        //this.dirLight.position.z += Math.tan(time);
        this.targetObject.position.x += Math.cos(time)/2;
        this.targetObject.position.y += Math.sin(time)/2;


        this.baseLight.position.x -= Math.cos(time)/2;
        this.baseLight.position.y -= Math.sin(time)/2;

        this.dirLightHelper.update()

        //RENDER
        //this.renderer.render( this.scene, this.camera ); //Default
        composer.render();
        this.stats.end();
    }

    onWindowResize() {
        const size = getPerspectiveSize(this.camera, this.camera.position.z); //Camera coord
        this.reScale = (size.width / (Math.abs(this.box3.max.x) + Math.abs(this.box3.min.x))) * 1.2;
        console.log('rescale',this.reScale)
        this.modelObj.scale.set(this.reScale, this.reScale, this.reScale)
        this.currentBox3 = new THREE.Box3().setFromObject(this.modelObj)


        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        composer.setSize( window.innerWidth, window.innerHeight );

        this.chromaticAberrationPass.uniforms.resolution.value.x = window.innerWidth;
        this.chromaticAberrationPass.uniforms.resolution.value.y = window.innerHeight;

        this.setWallPosition()
    }

    tweenWallPosition() {
        const index = this.index
        const y = this.getWallPositionForIndex(index)
    }

    setWallPosition() {
        const index = this.index
        const y = this.getWallPositionForIndex(index)

        this.modelObj.position.y = y
    }

    getWallPositionForIndex(index) {
        if (index === 0) {
            const height = Math.abs(this.box3.min.y - this.box3.max.y)
            const size = getPerspectiveSize(this.camera, this.camera.position.z); //Camera coord

            //return height * -0.47 + size.height
            //console.log(this.modelObj)
            return 0
        }
        else {
            //console.log(this.modelObj)
            for (let i = 0; i<this.modelObj.children.length; i++) {
                const child = this.modelObj.children[i]
                let name = child.name;
                name = name.substring(0,11);
                //console.log('Project'+i+'Pos')
                //console.log(name)
                if(name == 'Project'+index+'Pos') {
                    const v3 = new THREE.Vector3(
                        child.geometry.attributes.position.array[0],//x
                        child.geometry.attributes.position.array[1],//y
                        child.geometry.attributes.position.array[2]//z
                    )

                    //v3.y += Math.abs(this.currentBox3.min.y - this.currentBox3.max.y)
                    //v3.y = 0
                    //v3.y -= window.innerHeight/3
                    v3.y *= -this.reScale
                    console.log('Project'+index+'Pos',v3)
                    return v3.y
                }
            }

        }
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
                uDistortion: { type: "f", value: .5 },
                tDiffuse: { type: "t", value: null },
                resolution: {
                    value: new THREE.Vector2(
                        window.innerWidth,
                        window.innerHeight
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
			uniform float uDistortion;

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
				vec2 uv=(gl_FragCoord.xy/resolution.xy);

				vec4 sumcol = vec4(0.0);
				vec4 sumw = vec4(0.0);	
				for ( int i=0; i<num_iter;++i )
				{
					float t = float(i) * reci_num_iter_f;
					vec4 w = spectrum_offset( t );
					sumw += w;
					sumcol += w * texture2D( tDiffuse, barrelDistortion(uv, .6 * uDistortion*t ) );
				}

				gl_FragColor = sumcol / sumw;
			}
      `
        };
        //DEFAULT
        //const float max_distort = 2.2;

        chromaticAberrationPass = new THREE.ShaderPass(chromaticAberration);
        this.chromaticAberrationPass = chromaticAberrationPass;


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