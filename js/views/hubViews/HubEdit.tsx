import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEdit", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


import {styles, colors, } from '../styles'
import { BleUtil } from '../../util/BleUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {LOG, LOGe} from '../../logging/Log'
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import { INTENTS } from "../../native/libInterface/Constants";

import {SphereDeleted} from "../static/SphereDeleted";
import {StoneDeleted} from "../static/StoneDeleted";
import { STONE_TYPES } from "../../Enums";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { TopBarUtil } from "../../util/TopBarUtil";
import { OverlayUtil } from "../overlays/OverlayUtil";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";
import { SortingManager } from "../../logic/SortingManager";
import { Get } from "../../util/GetUtil";


export class HubEdit extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Edit hub", cancelModal: true, save: true});
  }

  deleting : boolean = false;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let hub = state.spheres?.[this.props.sphereId]?.hubs?.[this.props.hubId];
    
    this.state = {
      locationId: hub.config.locationId,
    };

  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'save') {  this._updateHub(); }
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();

      // in case the sphere is deleted
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }

      if (change.updateHubConfig && change.updateHubConfig.hubIds[this.props.hubId]) {
        if (this.deleting === false) {
          this.forceUpdate();
        }
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  constructStoneOptions(stone, state) {
    let items = [];
    let locations = state.spheres[this.props.sphereId].locations;

    let location = locations[this.state.locationId];
    let locationLabel = lang("Not_in_a_room");
    if (location !== undefined) {
      locationLabel = location.config.name;
    }
    locationLabel += lang("__tap_to_change_")

    items.push({label: "HUB IS IN ROOM:", type: 'explanation', below: false});
    items.push({
      label: locationLabel,
      mediumIcon:  <IconButton name="md-cube" size={25} buttonSize={38}  color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />,
      type:  'button',
      style: {color: colors.blue.hex},
      callback: () => {
        OverlayUtil.callRoomSelectionOverlay(this.props.sphereId, (roomId) => {
          this.setState({locationId: roomId})
        })
      }
    });

    if (Permissions.inSphere(this.props.sphereId).removeCrownstone) {
      items.push({label: lang("DANGER"), type: 'explanation', below: false});
      items.push({
        label: lang("Remove_from_Sphere"),
        mediumIcon: <IconButton name="ios-trash" size={26} buttonSize={38}  color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: async  () => {
          Alert.alert(
          "Are you sure you want to delete this hub?",
          "This cannot be undone!",
          [{text: "Delete", onPress: async () => {
              Alert.alert("TODO")
              // TODO: delete hub via rest/ble.
              // TODO: REST is not implemented yet.
            }, style: 'destructive'},{text:lang("Cancel"),style: 'cancel'}])
      }}
      );
      items.push({label: "Removing this Hub from the Sphere will revert it back to factory defaults (and back in setup mode). You may lose your data if you do this!",  type:'explanation', below:true});
    }

    return items;
  }

  _updateHub() {
    const store = core.store;
    const state = store.getState();
    const hub = Get.hub(this.props.sphereId, this.props.hubId);

    let actions = [];
    if (hub.config.locationId !== this.state.locationId) {
      actions.push({
        type:'UPDATE_HUB_CONFIG',
        sphereId: this.props.sphereId,
        hubId: this.props.hubId,
        data: {
          locationId:  this.state.locationId,
        }});
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }

    NavigationUtil.dismissModal();
  }


  render() {
    const state = core.store.getState();
    const hub = Get.hub(this.props.sphereId, this.props.hubId);
    let options = this.constructStoneOptions(hub, state);
    let backgroundImage = core.background.menu;

    return (
      <BackgroundNoNotification hasNavBar={false} image={backgroundImage}>
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
        </ScrollView>
      </BackgroundNoNotification>
    )
  }
}
