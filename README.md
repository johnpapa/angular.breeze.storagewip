angular.breeze.storagewip
============

Save Work in Progress to Local Storage for Angular and Breeze apps</p>

Version 1.0.0

##Setup
    // Add ngzWip to your module dependencies.
    var app = angular.module('app', ['ngzWip']);
                        </pre>
                    </div>
                    <div>
                        <h4>Configuration</h4>
                        <pre>
    app.config(['storageConfigProvider', function (cfg) {
        cfg.config = {
            // Must set these
            key: 'YourAppName', // Identifier for the app
            wipKey: 'YourAppName.WIP', // Identifer for the app's 
            version: '1.1.0', // Your app's version 

            // These are defaulted, but can be overriden
            enabled: false, // enable Local Storage (WIP is always enabled)
            events: { // names of events that WIP will fire
                error: 'store.error',
                storeChanged: 'store.changed',
                wipChanged: 'wip.changed'
            },
            appErrorPrefix: '[ngzWip] ', // optional prefix for any error messages
            newGuid: breeze.core.getUuid // GUID function generator
        };
    }]);


##API Usage

###API for `storageWip` service

    // Initialize storage with a Breeze EntityManager
    storageWip.init(entityManager)
    
    // Clear all WIP from local storage
    storageWip.clearAllWip()

    // Store 1 entity in local storage. Pass in the wip key, entityName, and a description.
    // routeState is the name of the route (after the hash) for the view where this entity may be viewed.
    // routeState defaults to entityName.toLowercase() 
    var key = storageWip.storeWipEntity(entity, key, entityName, description, routeState)

    // Remove 1 entity from local storage, by its WIP key
    storageWip.removeWipEntity(key)

    // Load 1 entity into Breeze's EntityManager
    // from local storage, by its WIP key
    storageWip.loadWipEntity(key)

    // Find 1 entity from local storage, by its entityName and id
    var wipKey = storageWip.findWipKeyByEntityId(entityName, id)

    // Get summary information for all WIP in local storage
    var wipSummary = storageWip.getWipSummary()


###API for `storage` service

    // Initialize storage with a Breeze EntityManager
    storage.init(entityManager)

    // Dictionary function to set if a key value is loaded 
    storage.areItemsLoaded(key, value)
    // Dictionary function to get if a key value is loaded 
    var value = storage.areItemsLoaded(key)

    // Clear all local storage, including WIP too
    storage.clear()

    // Load all of the entities form local storage 
    // into Breeze's EntityManager
    storage.load()

    // Save all of the Breeze EntityManager's entities 
    // to local storage
    storage.save()
