angular.breeze.storageWip
============

Save Work in Progress to Local Storage for Angular and Breeze apps.

Coming Soon to [Building Apps with Angular and Breeze](http://jpapa.me/spangz) on Pluralsight


Version 1.0.0

## NuGet
Get [Angular.Breeze.StorageWIP](https://www.nuget.org/packages/Angular.Breeze.StorageWIP) from NuGet

    install-package Angular.Breeze.StorageWIP


##Setup
    // Add ngzWip to your module dependencies.
    var app = angular.module('app', ['ngzWip']);

### `zStorageConfigProvider` Configuration

    app.config(['zStorageConfigProvider', function (cfg) {
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

###API for `zStorageWip` service

    // Initialize storage with a Breeze EntityManager
    zStorageWip.init(entityManager)
    
    // Clear all WIP from local storage
    zStorageWip.clearAllWip()

    // Store 1 entity in local storage. Pass in the wip key, entityName, and a description.
    // routeState is the name of the route (after the hash) for the view where this entity may be viewed.
    // routeState defaults to entityName.toLowercase() 
    var key = zStorageWip.storeWipEntity(entity, key, entityName, description, routeState)

    // Remove 1 entity from local storage, by its WIP key
    zStorageWip.removeWipEntity(key)

    // Load 1 entity into Breeze's EntityManager
    // from local storage, by its WIP key
    zStorageWip.loadWipEntity(key)

    // Find 1 entity from local storage, by its entityName and id
    var wipKey = zStorageWip.findWipKeyByEntityId(entityName, id)

    // Get summary information for all WIP in local storage
    var wipSummary = zStorageWip.getWipSummary()


###API for `zStorage` service

    // Initialize storage with a Breeze EntityManager
    zStorage.init(entityManager)

    // Dictionary function to set if a key value is loaded 
    zStorage.areItemsLoaded(key, value)
    // Dictionary function to get if a key value is loaded 
    var value = zStorage.areItemsLoaded(key)

    // Clear all local storage, including WIP too
    zStorage.clear()

    // Load all of the entities form local storage 
    // into Breeze's EntityManager
    zStorage.load()

    // Save all of the Breeze EntityManager's entities 
    // to local storage
    zStorage.save()
