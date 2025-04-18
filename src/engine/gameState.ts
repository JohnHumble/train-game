import { v4 } from "uuid";

export class GameState {
    map: Map<string, any>;
    typeMap: Map<string, Map<string, any>>;

    constructor() {
        this.map = new Map();
        this.typeMap = new Map();
    }

    get(id: string): any {
        return this.map.get(id);
    }

    getAll(type?: string): any[] {
        if (type !== undefined) {
            let map = this.typeMap.get(type);
            if (map !== undefined) {
                return [...map.values()];
            }
            return [];
        }
        return [...this.map.values()];
    }

    add(actor: any): string {
        if (actor.id === undefined || actor.id === "") {
            actor.id = v4();
        }

        this.map.set(actor.id, actor);
        if (actor.typeName !== undefined) {
            if (!this.typeMap.has(actor.typeName)) {
                this.typeMap.set(actor.typeName, new Map());
            }
            this.typeMap.get(actor.typeName).set(actor.id, actor);
        }
        return actor.id;
    }

    remove(id: string) {
        let actor = this.map.get(id);

        if ("typeName" in actor) {
            if (this.typeMap.has(actor.typeName)) {
                let tmap = this.typeMap.get(actor.typeName);
                tmap.delete(id);

                if (tmap.size <= 0) {
                    this.typeMap.delete(actor.typeName);
                }
            }
        }

        this.map.delete(id);
    }
}
