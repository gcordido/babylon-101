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
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from "cannon";

/*Declares and exports the BasicScene class, which initializes both the Babylon Scene and the Babylon Engine */

export class BasicScene {
    scene:Scene;
    engine:Engine;

constructor(private canvas: HTMLCanvasElement){
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.CreateController();
    this.CreateGround();
    this.CreateImpostors();
    this.CreateHoops();
    //LEAVE BALL OUT UNTIL WE FIGURE OUT WHY PHYSICS DONT WORK ON IT
    this.CreateBall();

    this.engine.runRenderLoop(()=>{
        this.scene.render();
    });

}
/*Creates the initial scene, with the following elements:
- Camera of type FreeCamera, at 0,1,-5
- Light of type HemisphericLight, at 0,1,0
*/
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
    // const envTex = CubeTexture.CreateFromPrefilteredData(
    //     "./environment/sky.env",
    //     scene
    // );

    // scene.environmentTexture = envTex;

    // scene.createDefaultSkybox(envTex, true);

    scene.onPointerDown = (evt) => {
        if (evt.button === 0) this.engine.enterPointerlock();
        if (evt.button === 1) this.engine.exitPointerlock();
    }

    scene.enablePhysics(
        new Vector3(0,-9.81,0),
        new CannonJSPlugin(true, 10, CANNON)
    );

    scene.collisionsEnabled = true;    
    return scene;
}

//FIRST PERSON CAMERA
CreateController(): void {
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
    const ball = models.meshes[0];
    ball.position = new Vector3(0,6,1.25);
    ball.scaling.scaleInPlace(.0125);

    ball.physicsImpostor = new PhysicsImpostor(
        ball,
        PhysicsImpostor.SphereImpostor,
        {mass: 1, restitution: 0.8},
        this.scene
    );

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

}
//SPHERE MESH PHYSICS TEST
// Ball(): void {
        
//     const sphere = MeshBuilder.CreateSphere("sphere", { diameter: .5 });
//     sphere.position = new Vector3(0, 6, 1.8);

//     sphere.physicsImpostor = new PhysicsImpostor(
//       sphere,
//       PhysicsImpostor.SphereImpostor,
//       { mass: 1, restitution: 1 }
//     );

// }

}