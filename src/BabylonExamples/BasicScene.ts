import {
    Scene, 
    Engine, 
    FreeCamera, 
    HemisphericLight, 
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Texture,
    SceneLoader,
    CubeTexture,
    PhysicsImpostor,
    CannonJSPlugin,
    ActionManager,
    ExecuteCodeAction,
} from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Image } from "@babylonjs/gui"
import "@babylonjs/loaders";
import * as CANNON from "cannon";

/*Declares and exports the BasicScene class, which initializes both the Babylon Scene and the Babylon Engine */

export class BasicScene {
    scene:Scene;
    engine:Engine;
    camera:FreeCamera;
    //add ball


constructor(private canvas: HTMLCanvasElement){
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.camera = this.CreateController();


    this.engine.runRenderLoop(()=>{
        this.scene.render();
    });

}
/** Creates the initial scene **/
CreateScene(): Scene {
    const scene = new Scene(this.engine);
    // const camera = new FreeCamera("camera", new Vector3(0,1,-5), this.scene);
    // camera.attachControl();
    // camera.speed = .25;

    const hemiLight = new HemisphericLight("hemiLight",
        new Vector3(0,1,0), 
        this.scene
        );

    hemiLight.intensity = 5;

    //ENVIRONMENT SKYBOX FOR LATER
    const envTex = CubeTexture.CreateFromPrefilteredData(
        "./environment/sky.env",
        scene
    );

    scene.environmentTexture = envTex;

    scene.createDefaultSkybox(envTex, true);

    scene.enablePhysics(
        new Vector3(0,-9.81,0),
        new CannonJSPlugin(true, 10, CANNON)
    );
    scene.collisionsEnabled = true;
    //hinders performance but creates ray to the center of the scene 
    scene.constantlyUpdateMeshUnderPointer = true;    

    //this.CreateController();
    this.CreateGround();
    this.CreateImpostors();
    this.CreateHoops();
    this.CreateBall();

    scene.onPointerDown = (evt, pickInfo) => {
        if (evt.button === 0) this.engine.enterPointerlock();
        if (evt.button === 1) this.engine.exitPointerlock();
        //condition to start ballHeld
        if (pickInfo.pickedMesh?.id === "basketball") {
            console.log("picked the ball");
        }
        console.log(pickInfo.pickedMesh?.id);
    }
    //shows that we are aiming at the ball correctly (clarifies where the pointer is)
    scene.onPointerMove = (evt, pickInfo) => {
        // if (pickInfo.pickedMesh?.id === "basketball"){
        //     //show pointer target
        //     target.isVisible = true;
        //     console.log("pointed at ball");
        // }
        // else target.isVisible = false;
    } 

    // const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
    //         "FullscreenUI"
    //     );
    // const target = new Image("target", targetImageDataURL);
    // target.width = "30%";
    // target.height = '30%';
    // target.stretch = Image.STRETCH_UNIFORM;
    // advancedTexture.addControl(target);

    return scene;
}

//FIRST PERSON CAMERA
CreateController(): FreeCamera {
    const camera = new FreeCamera("camera", new Vector3(0,1,-6), this.scene);
    camera.attachControl();

    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.5, 0.5, 0.5);

    camera.minZ = 1;
    camera.speed = 0.25;
    camera.angularSensibility = 3500;

    camera.keysUp.push(87);
    camera.keysLeft.push(65);
    camera.keysDown.push(83);
    camera.keysRight.push(68);

    return camera;

}

CreateGround(): void {
    const ground = MeshBuilder.CreateGround(
        "ground", 
        {width:15.24, height:28.65}, 
        this.scene
        );

    ground.material = this.CreateGroundMaterial();
}

CreateGroundMaterial(): StandardMaterial {
    const groundMat = new StandardMaterial("groundMat", this.scene);
    const texArray: Texture[] = [];

        const diffuseTex = new Texture(
        "./textures/wood/kitchen_wood_diff_1k.jpg",
        this.scene);
    groundMat.diffuseTexture = diffuseTex;
    texArray.push(diffuseTex);

    texArray.forEach((tex)=>{
        tex.uScale = 4;
        tex.vScale = 4;
    });

    return groundMat;
}

//IMPORT BASKETBALL HOOP MESHES
async CreateHoops(): Promise<void> {
    const models = await SceneLoader.ImportMeshAsync(
    "",
    "./models/",
    "hoop.glb"
    );
    const hoop = models.meshes[0];
    const hoop2 = hoop.clone("hoop2", null, false);
    hoop.position = new Vector3(0, 0, 12);
    hoop.scaling.scaleInPlace(0.35);
    
    if(hoop2){
        hoop2.position = new Vector3(0,0,-12);
        hoop2.scaling.scaleInPlace(0.35);
        const axis = new Vector3(0,1,0);
        hoop2.rotate(axis, Math.PI);
    }

}

//IMPORT BASKETBALL MESH

async CreateBall(): Promise<void>{
    const models = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "ball.glb",
    );
    const ball = models.meshes[1];
    console.log(typeof ball);
    ball.position = new Vector3(0,6,1.25);
    ball.scaling.scaleInPlace(.02);

    ball.physicsImpostor = new PhysicsImpostor(
        ball,
        PhysicsImpostor.SphereImpostor,
        {mass: 1, restitution: 0.8, ignoreParent: true, friction: 1},
        this.scene
    );

    ball.actionManager = new ActionManager(this.scene);
    //let ballIsHeld = false;

    //ACTION HAPPENS ON RAYCAST HIT RATHER THAN REGULAR CLICK

    // pick the ball mesh from scene this.scene.pick()
    // center of the screen 
    // if (ballIsHeld){

    //     ball.physicsImpostor.dispose();
    //     ball.physicsImpostor = null;
    //     ball.setParent(this.camera);
    //     ball.position.y = 2;
    //     ball.position.z = 2;
    //     ball.checkCollisions = true;

    //     ball.actionManager.registerAction(
    //         new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
    //             ball.physicsImpostor?.applyForce(
    //                 new Vector3(0, 300, 200),
    //                 ball.getAbsolutePosition().add(new Vector3(0,2,0))
    //             );
    //         })
    //     );
        
    // }

}

CreateImpostors(): void{
    const ground = MeshBuilder.CreateGround("ground", {
        width: 15.24,
        height: 28.65}
    );

    ground.isVisible = false;

    ground.physicsImpostor = new PhysicsImpostor(
        ground,
        PhysicsImpostor.BoxImpostor,
        {mass: 0, restitution: 0.5}
    );

    ground.checkCollisions = true;

    const limiter01 = MeshBuilder.CreateBox("limiter1",
    {width:15.24,
    height: 1000});

    limiter01.position.z = 15.25;
    limiter01.physicsImpostor = new PhysicsImpostor(
        limiter01,
        PhysicsImpostor.BoxImpostor
    );
    limiter01.isVisible = false;
    limiter01.checkCollisions = true;

    const limiter02 = limiter01.clone();
    limiter02.position.z = -15.25;

    const limiter03 = MeshBuilder.CreateBox("limiter3",
    {width: 5,
    height: 5,
    depth: 28.65});

    limiter03.position.x = 10;
    limiter03.physicsImpostor = new PhysicsImpostor(
        limiter03,
        PhysicsImpostor.BoxImpostor
    );
    limiter03.isVisible = false;
    limiter03.checkCollisions = true;

    const limiter04 = limiter03.clone();
    limiter04.position.x = -10;

}

}