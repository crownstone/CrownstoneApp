import { Alert, AppState } from 'react-native'

import { LOG, LOGError }              from './logging/Log'
import { CLOUD }            from './cloud/cloudAPI'
import { LocalizationUtil } from './native/LocalizationUtil'
import { Scheduler } from './logic/Scheduler'
import { BleActions, Bluenet, NativeBus } from './native/Proxy';
import { eventBus }         from './util/eventBus'
import { userHasPlugsInSphere }         from './util/dataUtil'


/**
 * this will handle pretty much anything that needs to be run on startup.
 *
 */
export const INITIALIZER = {
  /**
   * Init happens before start, it triggers
   */
  initialized: false,
  userReady: false,
  init: function() {
    LOG("INITIALIZER: called init.");
    if (this.initialized === false) {
      LOG("INITIALIZER: performing init.");

      // route the events to React Native
      Bluenet.rerouteEvents();

      // listen to the BLE events
      NativeBus.on(NativeBus.topics.bleStatus, (status) => {
        LOG("INITIALIZER: received NativeBus.topics.bleStatus event.");
        switch (status) {
          case "poweredOff":

            break;
          case "poweredOn":
            if (this.userReady) {
              BleActions.isReady().then(() => {
                Bluenet.startScanningForCrownstonesUniqueOnly();
              });
            }
            break;
          case "unauthorized":

            break;
          default:

            break;
        }
      });

      // listen to the BLE events
      NativeBus.on(NativeBus.topics.locationStatus, (status) => {
        LOG("INITIALIZER: received NativeBus.topics.locationStatus event.");
        switch (status) {
          case "unknown":

            break;
          case "on":

            break;
          case "foreground":

            break;
          case "off":

            break;
          default:

            break;
        }
      });

      this.initialized = true;
    }
  },

  /**
   * Start the app after init
   */
  started: false,
  start: function(store) {
    LOG("INITIALIZER: called start.");
    if (this.started === false) {
      LOG("INITIALIZER: performing start.");
      // subscribe to iBeacons when the spheres in the cloud change.
      CLOUD.events.on('CloudSyncComplete_spheresChanged', () => {LocalizationUtil.trackSpheres(store);});

      // when the app is started we track spheres and scan for Crownstones
      eventBus.on('appStarted', () => {
        LOG("INITIALIZER: received appStarted event.");
        BleActions.isReady()
          .then(() => {Bluenet.startScanningForCrownstonesUniqueOnly()});
        LocalizationUtil.trackSpheres(store);
        this.userReady = true;
      });

      // when a sphere is created, we track all spheres anew.
      eventBus.on('sphereCreated', () => {LocalizationUtil.trackSpheres(store);});

      // sync every 5 minutes
      Scheduler.setRepeatingTrigger('backgroundSync', {repeatEveryNSeconds:60*5});
      Scheduler.loadCallback('backgroundSync', () => {
        let state = store.getState();
        if (state.user.userId) {
          LOG("STARTING ROUTINE SYNCING IN BACKGROUND");
          CLOUD.sync(store, true).catch((err) => { LOGError("Error during background sync: ", err)});
        }
      });

      // configure the CLOUD network handler.
      let handler = function(error) {
        Alert.alert(
          "Connection Problem",
          "Could not connect to the Cloud. Please check your internet connection.",
          [{text: 'OK', onPress: () => {eventBus.emit('hideLoading');}}]
        );
      };

      // set the global network error handler.
      CLOUD.setNetworkErrorHandler(handler);

      // listen to the state of the app: if it is in the foreground or background
      AppState.addEventListener('change', (appState) => {
        if (appState === "active") {

        }
      });


      // trigger the CalibrateTapToToggle tutorial for existing users.
      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => {
        let state = store.getState();
        if (state.user.tapToToggleCalibration === null || state.user.tapToToggleCalibration === undefined) {
          if (userHasPlugsInSphere(state,sphereId))
            eventBus.emit("CalibrateTapToToggle");
        }
      });
      this.started = true;
    }
  }
};