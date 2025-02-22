import makeEngine from "./engine.js";
import { initializeCamera, initializeWorld } from "./world.js";
import { initializePlaceables } from "./placeables/placeables.js";
import { loadModels } from "./loader.js";

var engine = makeEngine();

// add model resource
loadModels(engine);

// initialize world
initializeCamera(engine);
initializeWorld(engine);

// add placeables
initializePlaceables(engine);

engine.start();
