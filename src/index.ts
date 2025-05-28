import { Engine } from "./engine/engine";
// import { initializePlaceables } from "./placeables/placeables";
import { loadModels } from "./loader";
// import { initializeTrainSystem } from "./train/controller";
import { WorldManager } from "./world/world";
import { ThreeWrapper } from "./world/threeWrapper";
import { PlaceableManager } from "./placeables/placeables";
import { MapGrid } from "./placeables/mapGrid";
import { MouseManager } from "./input/mouseManager";
import { CameraControl } from "./world/cameraControl";

async function main() {
    var engine = new Engine();

    // load models
    await loadModels();

    engine.addActor(new ThreeWrapper());
    engine.addActor(new WorldManager());
    engine.addActor(new CameraControl());
    engine.addActor(new MapGrid());
    engine.addActor(new PlaceableManager());
    engine.addActor(new MouseManager());

    // initialize world
    // initializeCamera(engine);
    // initializeWorld(engine);

    // add placeables
    // initializePlaceables(engine);
    // initializeTrainSystem(engine);

    engine.run();
}

main();
