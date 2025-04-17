import { Engine } from "./engine/engine";
// import { initializePlaceables } from "./placeables/placeables";
import { loadModels } from "./loader";
// import { initializeTrainSystem } from "./train/controller";
import { WorldManager } from "./world/world";
import { ThreeWrapper } from "./world/threeWrapper";

async function main() {
    var engine = new Engine();

    // load models
    await loadModels();

    let threeWrapper = new ThreeWrapper();
    engine.addActor(threeWrapper);

    engine.addActor(new WorldManager(threeWrapper.id));

    // initialize world
    // initializeCamera(engine);
    // initializeWorld(engine);

    // add placeables
    // initializePlaceables(engine);
    // initializeTrainSystem(engine);

    engine.run();
}

main();
