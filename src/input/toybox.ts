import { EventManager, EventPublisher } from "../engine/events";
import { GameState } from "../engine/gameState";
import { PlaceEvent } from "../placeables/placeables";
import * as THREE from "three";

export class Toybox {
    // Hold all possible placeable objects
    // Manage selection of placeable objects
    // Manage selection UI

    /**
     * UI should look like the following:
     *  | minimize |
     *  | x >| x1 | x2 | x3 |
     *  |---||----|----|----|
     *  | y || x4 | x5 | x6 |
     *  |---||----|----|----|
     *  | z || x7 | x8 | x9 |
     */

    // TODO see if these should be moved to another class

    /** Controls if the box is open or closed */
    isOpen: boolean;

    constructor() {
        this.isOpen = false;
    }

    public init(state: GameState, eventManager: EventManager) {
        // add
    }
}
