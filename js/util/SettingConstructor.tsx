import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableHighlight,
  View
} from 'react-native';

import { Util } from './Util'
import { AppUtil } from './AppUtil'
import { BluenetPromiseWrapper } from '../native/Proxy'
import { CLOUD } from '../cloud/cloudAPI'
import { Actions } from 'react-native-router-flux';
import { styles, colors } from '../views/styles'
import { Icon } from '../views/components/Icon'
import { IconButton } from '../views/components/IconButton'


const getIcon = function(name : string, size : number, iconColor: string, backgroundColor : string) {
  if (Platform.OS === 'android') {
    return <Icon name={name} size={size} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />
  }
  else {
    return <IconButton name={name} size={size} button={true} color={iconColor} buttonStyle={{backgroundColor:backgroundColor}}/>
  }
};

const insertExplanation = function(items: any[], label : string, below : boolean = false, style? : any) {
  if (Platform.OS === 'ios') {
    items.push({type: 'explanation', label: label, below: below});
  }
};

export const SettingConstructor = function(store, state, eventBus) {
  let items = [];

  insertExplanation(items, 'UPDATE YOUR PROFILE', false);
  items.push({
    label: 'My Account',
    icon: getIcon('ios-body', 23, colors.white.hex, colors.purple.hex),
    type: 'navigation',
    callback: () => {
    (Actions as any).settingsProfile()
    }
  });

  insertExplanation(items, 'CONFIGURATION', false);
  if (Object.keys(state.spheres).length > 0) {
    items.push({
      label: 'Spheres',
      icon: getIcon('ios-home', 22, colors.white.hex, colors.blue.hex),
      type: 'navigation',
      callback: () => { (Actions as any).settingsSphereOverview() }
    });
  }
  else {
    items.push({
      label: 'Add Sphere',
      icon: getIcon('ios-home', 22, colors.white.hex, colors.blue.hex),
      type: 'navigation',
      callback: () => {
        eventBus.emit('showLoading', 'Creating Sphere...');

        BluenetPromiseWrapper.requestLocation()
          .then((location) => {
            let latitude = undefined;
            let longitude = undefined;
            if (location && location.latitude && location.longitude) {
              latitude = location.latitude;
              longitude = location.longitude;
            }
            return CLOUD.createNewSphere(store, state.user.firstName, eventBus, latitude, longitude)
          })
          .then((sphereId) => {
            eventBus.emit('hideLoading');
            let state = store.getState();
            let title = state.spheres[sphereId].config.name;
            (Actions as any).settingsSphere({sphereId: sphereId, title: title})
          })
          .catch(() => {
            eventBus.emit('hideLoading');
          });
      }
    });
  }

  if (Object.keys(state.spheres).length > 0) {
    items.push({
      label: 'Mesh Overview',
      type: 'navigation',
      style: {color: '#000'},
      icon: getIcon('md-share', 23, colors.white.hex, colors.menuBackground.hex),
      callback: () => { (Actions as any).settingsMeshOverview(); }
    });
  }

  let presentSphere = Util.data.getPresentSphere(state);
  if (presentSphere && Util.data.userHasPlugsInSphere(state, presentSphere) || true) {
    let tapToToggleSettings = { tutorial: false };
    if (Util.data.getTapToToggleCalibration(state)) {
      tapToToggleSettings.tutorial = true;
    }
    items.push({
      label:'Calibrate Tap-to-Toggle',
      type:'button',
      style: {color:'#000'},
      icon: getIcon('md-flask', 22, colors.white.hex, colors.darkGreen.hex),
      callback: () => { eventBus.emit("CalibrateTapToToggle", tapToToggleSettings); }
    });
  }

  insertExplanation(items, 'TROUBLESHOOTING', false);
  items.push({
    label:'Help',
    type:'navigation',
    icon: getIcon('ios-help-circle', 22, colors.white.hex, colors.green2.hex),
    callback: () => { Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {})}
  });
  items.push({
    label: 'Recover a Crownstone',
    icon: getIcon('c1-socket2', 23, colors.white.hex, colors.menuTextSelected.hex),
    type: 'navigation',
    callback: () => { (Actions as any).settingsPluginRecoverStep1(); }
  });
  insertExplanation(items, 'If you want to reset a Crownstone because it is not responding correctly, recover it!', true);

  items.push({
    label:'Log Out',
    type:'button',
    icon: getIcon('md-log-out', 22, colors.white.hex, colors.menuRed.hex),
    callback: () => {
      Alert.alert('Log out','Are you sure?',[
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => { AppUtil.logOut() }}
      ])
    }});



  return items;
};