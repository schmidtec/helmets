/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

/**
 * The structure of a hat entry in the hat database.
 */
type HatDescriptor = {
    displayName: string;
    resourceId: string;
    scale: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    position: {
        x: number;
        y: number;
        z: number;
    };
};

/**
 * The structure of the hat database.
 */
type HatDatabase = {
    [key: string]: HatDescriptor;
};

// Load the database of hats.
// tslint:disable-next-line:no-var-requires variable-name
var HatDatabase: HatDatabase = {};

/**
 * WearAHat Application - Showcasing avatar attachments.
 */
export default class WearAHat {
    // Container for preloaded hat prefabs.
    private prefabs: { [key: string]: MRESDK.AssetGroup } = {};
    // Container for instantiated hats.
    private attachedHats: { [key: string]: MRESDK.Actor } = {};

    /**
     * Constructs a new instance of this class.
     * @param context The MRE SDK context.
     * @param baseUrl The baseUrl to this project's `./public` folder.
     */
    constructor(private context: MRESDK.Context, private params: MRESDK.ParameterSet, private baseUrl: string) {
        // Hook the context events we're interested in.
        this.context.onStarted(() => {
            // Choose the set of helmets
            // e.g. ws://10.0.1.89:3901?kit=city_helmets
            switch(this.params.kit) {
                case "city_helmets": {
                    HatDatabase = require('../public/1167643861778956427_city_helmets');
                    break;
                }
                default: {
                    HatDatabase = require('../public/1158964902488965895.json');
                    break;
                }
            }

            this.started();
        });
        this.context.onUserLeft(user => this.userLeft(user));
    }

    /**
     * Called when a Hats application session starts up.
     */
    private async started() {
        // Show the hat menu.
        this.showHatMenu();
    }

    /**
     * Called when a user leaves the application (probably left the Altspace world where this app is running).
     * @param user The user that left the building.
     */
    private userLeft(user: MRESDK.User) {
        // If the user was wearing a hat, destroy it. Otherwise it would be
        // orphaned in the world.
        if (this.attachedHats[user.id]) this.attachedHats[user.id].destroy();
        delete this.attachedHats[user.id];
    }

    /**
     * Show a menu of hat selections.
     */
    private showHatMenu() {
        // Create a parent object for all the menu items.
        const menu = MRESDK.Actor.CreateEmpty(this.context).value;
        let x = 0;

        // Loop over the hat database, creating a menu item for each entry.
        for (const hatId of Object.keys(HatDatabase)) {
            const hatRecord = HatDatabase[hatId];

            // Create a clickable button.
            const button = MRESDK.Actor.CreatePrimitive(this.context, {
                definition: {
                    shape: MRESDK.PrimitiveShape.Box,
                    dimensions: { x: 0.3, y: 0.3, z: 0.3 }
                },
                addCollider: true,
                actor: {
                    parentId: menu.id,
                    name: hatId,
                    transform: {
                        position: { x, y: 0, z: 0 }
                    }
                }
            });

            if (hatRecord.resourceId) {
                const rotation = hatId == "movedown" ? hatRecord.rotation : { x: 0, y: 0, z: 0 }

                // Create a clickable Artifact
                MRESDK.Actor.CreateFromLibrary(this.context, {
                    resourceId: hatRecord.resourceId,
                    actor: {
                        transform: {
                            position: { x, y: 1, z: 0 },
                            rotation: MRESDK.Quaternion.FromEulerAngles(
                                rotation.x * MRESDK.DegreesToRadians,
                                rotation.y * MRESDK.DegreesToRadians,
                                rotation.z * MRESDK.DegreesToRadians),
                            scale: { x: 3, y: 3, z: 3 }
                        }
                    }
                }).value;
            }
            else {
                // // Create a label for the menu entry.
                // MRESDK.Actor.CreateEmpty(this.context, {
                //     actor: {
                //         parentId: menu.id,
                //         name: 'label',
                //         text: {
                //             contents: HatDatabase[hatId].displayName,
                //             height: 0.5,
                //             anchor: MRESDK.TextAnchorLocation.MiddleLeft
                //         },
                //         transform: {
                //             position: { x, y: 0, z: 0 }
                //         }
                //     }
                // });
            }


            // Set a click handler on the button.
            button.value.setBehavior(MRESDK.ButtonBehavior)
                .onClick('released', (userId: string) => this.wearHat(hatId, userId));

            x += 1.5;
        }
    }

    /**
     * Instantiate a hat and attach it to the avatar's head.
     * @param hatId The id of the hat in the hat database.
     * @param userId The id of the user we will attach the hat to.
     */
    private wearHat(hatId: string, userId: string) {
        // If the user selected 'clear', then early out.
        if (hatId == "clear") {
            // If the user is wearing a hat, destroy it.
            if (this.attachedHats[userId]) this.attachedHats[userId].destroy();
            delete this.attachedHats[userId];
            return;
        }
        else if (hatId == "moveup") {
            this.attachedHats[userId].transform.position.y += 0.01;
            return;
        }
        else if (hatId == "movedown") {
            this.attachedHats[userId].transform.position.y -= 0.01;
            return;
        }

        // If the user is wearing a hat, destroy it.
        if (this.attachedHats[userId]) this.attachedHats[userId].destroy();
        delete this.attachedHats[userId];

        const hatRecord = HatDatabase[hatId];


        // Create the hat model and attach it to the avatar's head.

        // Jimmy

        const position = hatRecord.position ? hatRecord.position : { x: 0, y: 0, z: 0 }
        const scale = hatRecord.scale ? hatRecord.scale : { x: 1.5, y: 1.5, z: 1.5 }
        const rotation = hatRecord.rotation ? hatRecord.rotation : { x: 0, y: 180, z: 0 }

        this.attachedHats[userId] = MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: hatRecord.resourceId,
            actor: {
                transform: {
                    position: position,
                    rotation: MRESDK.Quaternion.FromEulerAngles(
                        rotation.x * MRESDK.DegreesToRadians,
                        rotation.y * MRESDK.DegreesToRadians,
                        rotation.z * MRESDK.DegreesToRadians),
                    scale: scale
                },
                attachment: {
                    attachPoint: 'head',
                    userId
                }
            }
        }).value;


        // this.attachedHats[userId] = MRESDK.Actor.CreateFromPrefab(this.context, {
        //     prefabId: this.prefabs[hatId].prefabs.byIndex(0).id,
        //     actor: {
        //         transform: {
        //             position: hatRecord.position,
        //             rotation: MRESDK.Quaternion.FromEulerAngles(
        //                 hatRecord.rotation.x * MRESDK.DegreesToRadians,
        //                 hatRecord.rotation.y * MRESDK.DegreesToRadians,
        //                 hatRecord.rotation.z * MRESDK.DegreesToRadians),
        //             scale: hatRecord.scale,
        //         },
        //         attachment: {
        //             attachPoint: 'head',
        //             userId
        //         }
        //     }
        // }).value;
    }
}
