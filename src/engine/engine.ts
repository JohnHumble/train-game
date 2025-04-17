import * as THREE from "three";
import { EventManager } from "./events";
import { GameState } from "./gameState";

export interface IInitActor {
    init: (state: GameState, eventManager: EventManager) => void;
}

export interface IUpdateActor {
    update: (state: GameState, elapsedTime: number) => void;
}

export class Engine {
    updateActors: IUpdateActor[];
    initActors: IInitActor[];

    state: GameState;
    public readonly eventManager: EventManager;

    constructor() {
        this.state = new GameState();
        this.eventManager = new EventManager();
        this.updateActors = [];
        this.initActors = [];
    }

    public addActor(actor: any): void {
        if (actor.inState !== undefined && actor.inState) {
            this.state.add(actor);
        }

        if (containsFunction(actor, "init")) {
            this.initActors.push(actor);
        }

        // if ("update" in actor) {
        if (containsFunction(actor, "update")) {
            this.updateActors.push(actor);
        }
    }

    public run(): void {
        // run initialize actors first
        this.initActors.forEach((actor) =>
            actor.init(this.state, this.eventManager),
        );

        const clock = new THREE.Clock();

        // start game loop
        const renderLoop = () => {
            const elapsedTime = clock.getDelta();
            // TODO put updating code here.
            this.updateActors.forEach((actor) =>
                actor.update(this.state, elapsedTime),
            );

            window.requestAnimationFrame(renderLoop);
        };

        renderLoop();
    }
}

function containsFunction(actor: any, functionName: string): boolean {
    return functionName in actor && typeof actor[functionName] === "function";
}
