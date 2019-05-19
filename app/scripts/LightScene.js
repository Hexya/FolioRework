export default class LightScene {

    constructor(scene,composer,renderer) {
        this.dirLight = new THREE.DirectionalLight( 0xffffff, 8 );//Power light
        this.dirLight.castShadow = true;
        this.dirLight.position.set(0,-150,-50);
        scene.add(this.dirLight);

        this.dirLightHelper = new THREE.DirectionalLightHelper( this.dirLight, 10 );
        scene.add( this.dirLightHelper );

        this.targetObject = new THREE.Object3D();
        scene.add(this.targetObject);
        this.targetObject.position.y = -150;

        this.dirLight.target = this.targetObject;

        this.baseLight = new THREE.DirectionalLight( 0xffffff, 6 );//Power light
        this.baseLight.castShadow = true;
        this.baseLight.position.set(50,-60,-50);
        scene.add(this.baseLight);

        this.baseLightHelper = new THREE.DirectionalLightHelper( this.baseLight, 1 );
        scene.add( this.baseLightHelper );

        this.render()
    }

    render(composer) {
        requestAnimationFrame(this.render())
        let time = Date.now()/1000;// rayon
        this.dirLight.position.x += Math.cos(time)/2;
        this.dirLight.position.y += Math.sin(time)/2;
        //this.dirLight.position.z += Math.tan(time);
        this.targetObject.position.x += Math.cos(time)/2;
        this.targetObject.position.y += Math.sin(time)/2;


        this.baseLight.position.x -= Math.cos(time)/2;
        this.baseLight.position.y -= Math.sin(time)/2;

        this.dirLightHelper.update()
    }
}