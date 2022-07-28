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
    AbstractMesh,
    Ray
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
    ball?:AbstractMesh;

constructor(private canvas: HTMLCanvasElement){
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.camera = this.CreateController();
    this.CreateBall().then(ball => { this.ball = ball });

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
    scene.actionManager = new ActionManager();
    const hemiLight = new HemisphericLight("hemiLight",
        new Vector3(0,1,0), 
        this.scene
        );

    hemiLight.intensity = 5;

    //Environment Skybox, imports the city image 360 view
    const envTex = CubeTexture.CreateFromPrefilteredData(
        "./environment/sky.env",
        scene
    );
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true);


    /*Enables Physics in the Scene
        - Engine: CannonJS (test Ammo.js for better performance)
        - Allows for collisions to happen, mainly used for the camera+ground collision
    */
    scene.enablePhysics(
        new Vector3(0,-9.81,0),
        new CannonJSPlugin(true, 100, CANNON)
    );
    scene.collisionsEnabled = true;

    //hinders performance but creates ray to the center of the scene 
    //scene.constantlyUpdateMeshUnderPointer = true;    

    /*Creates the remaining components of the Scene
        - Ground Component:
        - Physic Impostors: Allows for physics interactions between different Meshes.
            These are modelled around the 3D meshes, similar to colliders.
        - Hoops: Basketball Hoop Meshes
    */
    this.CreateGround();
    this.CreateImpostors();
    this.CreateHoops();
        
    const target = new Image("grab", "./images/reach.png");
    target.stretch = Image.STRETCH_UNIFORM;
    target.width = "15%"
    target.height = "15%"
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("FullscreenUI");
    advancedTexture.addControl(target);
    let ballIsHeld = false;

    /*Stars the first onPointerDown instance to get into the game.
        - The first click will lock the pointer for the camera to pan around.
        -  
    */
    scene.onPointerDown = (evt, pickInfo) => {
        if (evt.button === 0) this.engine.enterPointerlock();
        if (evt.button === 1) this.engine.exitPointerlock();
        //condition to start ballHeld
        // if (pickInfo.pickedMesh?.id === "basketball") {
        //     console.log("picked the ball");
        //     if(this.ball){this.PickBall(this.ball);}
        // }
        //Currently starts the PickBall() method when the ball is clicked.
        if(this.BallCheck()){
            target.isVisible = false;
            ballIsHeld = true;
            this.PickBall();
        }
    }

    /*Starts an onPointMove instance to being the game functionality.
        - Ideally, the rayCast will detect when the camera is pointing at the ball and 
        start the PickBall() function on a TBD KeyDown event. */
    scene.onPointerMove = () => {
        //Create function for boolean value
        if(this.BallCheck() && !ballIsHeld){
            target.isVisible = true;
            console.log("target shows up");
        }
        else target.isVisible = false;

    }
    
    // this.camera.onCollide = function (collidedMesh) {
    //     if(collidedMesh.id === "basketball"){
    //         console.log("collided with ball");
    //     }
    // }

    //shows that we are aiming at the ball correctly (clarifies where the pointer is)
    // scene.onPointerMove = (evt, pickInfo) => {
    //     // if (pickInfo.pickedMesh?.id === "basketball"){
    //     //     //show pointer target
    //     //     target.isVisible = true;
    //     //     console.log("pointed at ball");
    //     // }
    //     // else target.isVisible = false;
    // } 

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

    // camera.onCollide = function (collidedMesh) {
    //     if(collidedMesh.id === "basketball"){
    //         console.log("collided with ball");
    //     }
    // }
    return camera;

}
/* CreateGround Method
    - Creates a ground mesh
*/
CreateGround(): void {
    const ground = MeshBuilder.CreateGround(
        "ground", 
        {width:15.24, height:28.65}, 
        this.scene
        );

    ground.material = this.CreateGroundMaterial();
}
/* CreateGroundMaterial Method
    - Creates a Material for the ground mesh using one of the assets.
*/
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

/* CreateHoops Method
    - Import a 3D Hoop Mesh, clones it and relocates them to the ends of the court.
*/
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

/* CreateBall() Method
    - Imports a 3D basketball model.
*/
async CreateBall(): Promise<AbstractMesh>{
    const models = await SceneLoader.ImportMeshAsync(
        "",
        "./models/",
        "ball.glb",
    );
    const ball = models.meshes[1];
    ball.position = new Vector3(0,6,1.25);
    ball.scaling.scaleInPlace(.02);

    ball.physicsImpostor = new PhysicsImpostor(
        ball,
        PhysicsImpostor.SphereImpostor,
        {mass: 1, restitution: 0.5, ignoreParent: true, friction: 1},
        this.scene
    );

    ball.actionManager = new ActionManager(this.scene);
    //Needed for onCollide with camera
    // ball.checkCollisions = true;

    return ball;

}

BallCheck(): boolean{
    let isBallOnSight = false;
    const rayCast = this.camera.getForwardRay();
    if(this.ball){
        const ballIsSeen = (rayCast.intersectsMesh(this.ball));
        if (ballIsSeen.pickedMesh?.id === "basketball"){
            isBallOnSight = true;
        }   
    }
    return isBallOnSight;   
}

PickBall(): void {

    if(this.ball){
        //attaches ball mesh to camera
        this.ball.setParent(this.camera);
        this.ball.position.y = 0;
        this.ball.position.z = 3;
        this.ball.physicsImpostor?.dispose();
        this.ball.physicsImpostor = null;
        //this.ball.checkCollisions = true;

        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnKeyDownTrigger,
                    parameter: "r"
                },
                () => {
                    if(this.ball){
                        this.ball.setParent(null);
                        this.ball.physicsImpostor = new PhysicsImpostor(
                            this.ball,
                            PhysicsImpostor.SphereImpostor,
                            {mass: 1, restitution: 0.5, ignoreParent: true, friction: 1},
                            this.scene
                        );
                        this.ball.checkCollisions = true;
                    }
                    //BUG: IMPULSE IS APPLIED WITH DIRECTION, NOT SOLELY MAGNITUDE. MUST FIND A WAY TO APPLY IN 
                    //CAMERA'S DIRECTION RATHER THAN A STRICT Z VALUE.
                    this.ball?.applyImpulse(new Vector3(0, 7, 7), this.ball.getAbsolutePosition());
                }
            )
        )
    }
    return;

}

CreateImpostors(): void{
    const ground = MeshBuilder.CreateBox("ground", {
        width: 15.24,
        height: 2,
        depth: 28.65},
    );

    ground.position.y = -1;

    ground.isVisible = false;

    ground.physicsImpostor = new PhysicsImpostor(
        ground,
        PhysicsImpostor.BoxImpostor,
        {mass: 0, restitution: 0.5}
    );

    ground.checkCollisions = true;

    const limiter01 = MeshBuilder.CreateBox("limiter1",
    {width:15.24,
    height: 15,
    depth:2});

    limiter01.position.z = 15.24;
    limiter01.physicsImpostor = new PhysicsImpostor(
        limiter01,
        PhysicsImpostor.BoxImpostor
    );
    limiter01.isVisible = false;
    limiter01.checkCollisions = true;

    const limiter02 = limiter01.clone();
    limiter02.position.z = -15.24;

    const limiter03 = MeshBuilder.CreateBox("limiter3",
    {width: 5,
    height: 15,
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
    
    const boardLimiter = MeshBuilder.CreateBox("board1",
    {width: 3,
    height: 2,
    depth: .25});
    boardLimiter.position.z = 11.5;
    boardLimiter.position.y = 4.5;
    boardLimiter.isVisible = false;

    boardLimiter.physicsImpostor = new PhysicsImpostor(
        limiter01,
        PhysicsImpostor.BoxImpostor
        );
    boardLimiter.checkCollisions = true;

    const boardLimiter02 = boardLimiter.clone();
    boardLimiter02.position.z = -11.5;
}

}