/*
 * Copyright 2013 John Papa. All Rights Reserved.  
 * Use, reproduction, distribution, and modification of this code is subject to the terms and 
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Author: John Papa 
 * Project: https://github.com/johnpapa/angular.breeze.storagewip
 *
 * Dependencies: HTML5 localStorage, Breeze and Angular.
 *
 * Description:
 * Defines the ngzWip.storage module, and provides the base 
 * features for the services storage and storageWip 
 * 
 * Must setup the storageConfigProvider first, with all of 
 * the storage settings.
 */
(function () {
    'use strict';

    var storageModule = angular.module('ngzWip.storage');

    /*
     * storageModule provider
     * 
     * Configure the Storage and WIP features.
     */
    storageModule.provider('storageConfig', function () {
        this.config = {
            // These are the properties we need to set
            // storage
            enabled: false,
            key: '',
            events: {
                error: 'store.error',
                storeChanged: 'store.changed',
                wipChanged: 'wip.changed'
            },
            // storageWip
            wipEnabled: true,
            wipKey: '',
            appErrorPrefix: '',
            newGuid: function() { },
            // storageCore
            version: ''
        };

        this.$get = function () {
            return {
                config: this.config
            };
        };
    });

    /*
     * storageCore service
     * 
     * For internal use by storage and storageWip services
     */
    storageModule.factory('storageCore', ['$rootScope', 'storageConfig', storageCore]);

    function storageCore($rootScope, storageConfig) {
        var storeConfig = storageConfig.config;
        var storeMeta = {
            breezeVersion: breeze.version,
            appVersion: storeConfig.version,
            isLoaded: {
                sessions: false,
                attendees: false
            }
        };

        var service = {
            _broadcast: _broadcast,
            checkStoreImportVersionAndParseData: checkStoreImportVersionAndParseData,
            formatStorageData: formatStorageData,
            storeMeta: storeMeta
        };
        
        return service;

        function _broadcast(messageName, activity, wip){
            return $rootScope.$broadcast(messageName, {activity: activity, wip: wip || [] });
        }

        function checkStoreImportVersionAndParseData(importedData) {
            if (!importedData) {
                return importedData;
            }
            try {
                var data = JSON.parse(importedData);
                var importMeta = data[0];
                if (importMeta.breezeVersion === storeMeta.breezeVersion &&
                    importMeta.appVersion === storeMeta.appVersion) {
                    if (importMeta.isLoaded) {
                        storeMeta.isLoaded.sessions = storeMeta.isLoaded.sessions || importMeta.isLoaded.sessions;
                        storeMeta.isLoaded.attendees = storeMeta.isLoaded.attendees || importMeta.isLoaded.attendees;
                    }
                    return data[1];
                } else {
                    broadcast(storageConfig.events.error, 
                        'Did not load from storage because mismatched versions', 
                        {current: storeMeta, storage: importMeta });
                }
            } catch (ex) {
                broadcast(storageConfig.events.error, 'Exception during load from storage: ' + ex.message, ex);
            }
            return null; // failed
        }

        function formatStorageData(meta, data) {
            return '[' + JSON.stringify(meta) + ',' + data + ']';
        }
    }

    /*
     * storage service
     * 
     * API's for saving, loading, and clearing breeze
     * entity manager from local storage
     */
    storageModule.factory('storage',
        ['$rootScope', '$window', 'storageConfig', 'storageCore', storage]);

    function storage($rootScope, $window, storageConfig, storageCore) {
        var storeConfig = storageConfig.config;
        var manager;
        var storageKey = storeConfig.key;
        var enabled = storeConfig.enabled;

        var service = {
            areItemsLoaded: areItemsLoaded,
            clear: clear,
            init: init,
            load: load,
            save: save
        };

        return service;
        
        function init (mgr) { manager = mgr; }
        
        function areItemsLoaded(key, value) {
            if (value === undefined) {
                return storageCore.storeMeta.isLoaded[key]; // get
            }
            return storageCore.storeMeta.isLoaded[key] = value; // set
        }

        function clear () {
            $window.localStorage.clear();
            storageCore._broadcast(storeConfig.events.wipChanged, 'cleared all WIP');
            storageCore._broadcast(storeConfig.events.storeChanged, 'cleared');
        }

        function load () {
            if (enabled) {
                return importData();
            }
            return false;
        }

        function save () { //msg) {
            if (enabled) {
                var exportData = manager.exportEntities();
                saveToLocalStorage(storageKey, exportData);
                storageCore._broadcast(storeConfig.events.storeChanged, 'saved', exportData);
            }
        }

        function importData() {
            var importedData = $window.localStorage.getItem(storageKey);
            importedData = storageCore.checkStoreImportVersionAndParseData(importedData);
            var hasData = !!importedData;
            if (hasData) {
                manager.importEntities(importedData);
            }
            return hasData;
        }
        
        function saveToLocalStorage(key, data) {
            $window.localStorage.setItem(key, storageCore.formatStorageData(storageCore.storeMeta, data));
        }
    }

    /*
     * storageWip service
     * 
     * API's for saving, loading, finding and clearing breeze
     * breeze work in progress (WIP) from local storage
     */
    storageWip.factory('storageWip',
        ['$q', '$rootScope', '$window', 'storageConfig', 'storageCore', storageWip]);

    function storageWip($q, $rootScope, $window, storageConfig, storageCore) {
        var storeConfig = storageConfig.config;
        var manager;
        var wipEnabled = storeConfig.wipEnabled;
        var wipKey = storeConfig.wipKey;

        var service = {
            clearAllWip: clearAllWip,
            findWipKeyByEntityId: findWipKeyByEntityId,
            init: init,
            getWipSummary: getWipSummary,
            loadWipEntity: loadWipEntity,
            removeWipEntity: removeWipEntity,
            storeWipEntity: storeWipEntity
        };

        return service;

        function init(mgr) {
            manager = mgr;
            return service;
        }

        function clearAllWip() {
            var wip = getWipSummary();
            wip.forEach(function (item) {
                $window.localStorage.removeItem(item.key);
            });
            storageCore._broadcast(storeConfig.events.wipChanged, 'cleared all WIP');
            $window.localStorage.removeItem(wipKey);
        }

        function findWipKeyByEntityId (entityName, id) {
            var wip = getWipSummary();
            var wipItem = wip.filter(function(item) {
                return item.entityName.toLowerCase() === entityName.toLowerCase() && item.id === id;
            })[0];
            return wipItem ? wipItem.key : null;
        }

        function getWipSummary () {
            var wip = [];
            var raw = $window.localStorage.getItem(wipKey);
            if (raw) { wip = JSON.parse(raw); }
            return wip;
        }

        function loadWipEntity (wipEntityKey) {
            if (wipEnabled) {
                return importWipData(wipEntityKey);
            }
            return null;
        }

        function removeWipEntity (key) {
            if (!key) { return; }

            $window.localStorage.removeItem(key);
            // Remove the 1 wip header and create new array
            var wip = getWipSummary();
            var updatedWip = wip.filter(function (item) {
                return item.key !== key;
            });
            // re-save the wip summary and broadcast the changes
            $window.localStorage.setItem(wipKey, JSON.stringify(updatedWip));
            storageCore._broadcast(storeConfig.events.wipChanged, 'removed 1 entity', updatedWip);
        }

        function storeWipEntity (entity, key, entityName, description, routeState) {
            // Entity is the entity to export.
            // key must also be passed. this allows us to save
            // an entity by itself away from the datacontext.
            // Data stashed here will not be imported into the 
            // datacontext automatically.
            var prefix = storeConfig.appErrorPrefix;
            if (!entity) { throw new Error(prefix + 'Must pass entity to storeWipEntity'); }
            if (!entityName) { throw new Error(prefix + 'Must pass entityName to storeWipEntity'); }
            if (!description) { throw new Error(prefix + 'Must pass description to storeWipEntity'); }
            if (!routeState) { routeState = entityName.toLowerCase(); }

            if (wipEnabled) {
                var entityState = entity.entityAspect.entityState;
                var theseAreTheDroidsYoureLookingFor = entityState.isAdded() || entityState.isModified();
                if (!theseAreTheDroidsYoureLookingFor) { return key; }
                if (!key) { key = storeConfig.newGuid(); }
                var exportData = manager.exportEntities([entity], false);
                saveToWipLocalStorage(key, exportData);
                storeWipSummary(entity, key, entityName, description, routeState);
            }
            return key;
        }

        function importWipData(key) {
            var importedData = $window.localStorage.getItem(key);
            importedData = storageCore.checkStoreImportVersionAndParseData(importedData);
            var hasData = !!importedData;
            if (hasData) {
                var importResults = manager.importEntities(importedData);
                var importedEntity = importResults.entities[0];
                return importedEntity;
            }
            return null;
        }
        
        function saveToWipLocalStorage(key, data) {
            var meta = { // trimmed
                breezeVersion: storageCore.storeMeta.breezeVersion,
                breezeMetadataVersion: storageCore.storeMeta.breezeMetadataVersion,
                appVersion: storageCore.storeMeta.appVersion
            };
            $window.localStorage.setItem(key, storageCore.formatStorageData(meta, data));
        }

        function storeWipSummary(entity, key, entityName, description, routeState) {
            var wipHeader = {
                id: entity.id,
                date: new Date(),
                key: key,
                routeState: routeState,
                state: entity.entityAspect.entityState.name,
                entityName: entityName,
                description: description
            };
            var wipSummary = getWipSummary();
            var exists = wipSummary.some(function (item) {
                return item.key === wipHeader.key;
            });
            if (!exists) {
                wipSummary.push(wipHeader);
                $window.localStorage.setItem(wipKey, JSON.stringify(wipSummary));
            }
            storageCore._broadcast(storeConfig.events.wipChanged, 'saved', wipSummary);
        }
    }
})();