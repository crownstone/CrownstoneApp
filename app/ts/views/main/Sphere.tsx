
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Sphere", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View,
  ViewStyle
} from "react-native";

import { RoomLayer }           from './RoomLayer'
import { StatusCommunication } from './StatusCommunication'
import { LOG }       from '../../logging/Log'
import { screenWidth, availableScreenHeight, colors, overviewStyles } from "../styles";
import {DfuStateHandler} from "../../native/firmware/DfuStateHandler";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {Icon} from "../components/Icon";
import { core } from "../../core";
import { DataUtil } from "../../util/DataUtil";


export class Sphere extends Component<any, any> {
  render() {
    LOG.info("RENDERING SPHERE");
    const state = core.store.getState();

    let viewingRemotely = true;
    let currentSphere = this.props.sphereId;

    let sphereIsPresent = state.spheres[currentSphere].state.present;
    if (sphereIsPresent ||  DfuStateHandler.areDfuStonesAvailable()) {
      viewingRemotely = false;
    }

    let noRoomsCurrentSphere = (currentSphere ? Object.keys(state.spheres[currentSphere].locations).length : 0) == 0;
    let noStones = (currentSphere ? Object.keys(state.spheres[currentSphere].stones).length : 0) == 0;
    let floatingStones = Object.keys(DataUtil.getStonesInLocation(state, this.props.sphereId, null)).length;
    let availableStones = (currentSphere ? Object.keys(state.spheres[currentSphere].stones).length - floatingStones : 0);

    // on screen buttons are 0.11*screenWidth high.
    let viewStyle : ViewStyle = {
      position:'absolute',
      top: 0.11*screenWidth, left:0,
      alignItems: 'center', justifyContent: 'center',
      height: availableScreenHeight - 2*0.11*screenWidth, width: screenWidth, padding:15
    };


    // This is an empty sphere. Tell the user what to expect.
    if (noStones === true && noRoomsCurrentSphere == true) {
      if (Permissions.inSphere(this.props.sphereId).seeSetupCrownstone !== true) {
        // this user cannot see setup Crownstones. Tell him the admin will have to add them.
        return (
          <View style={viewStyle}>
            <Icon name="c2-pluginFront" size={150} color={colors.menuBackground.hex}/>
            <Text style={overviewStyles.mainText}>{ lang("No_Crownstones_added_yet_") }</Text>
            <Text style={overviewStyles.subText}>{ lang("Ask_the_admin_of_this_Sph") }</Text>
          </View>
        )
      }
    }

    if (availableStones === 0 && floatingStones > 0 && noRoomsCurrentSphere) {
      // This dude cant add rooms and floating Crownstones need to be put in rooms. Tell him how to continue.
      return (
        <View style={viewStyle}>
          <Icon name="c2-pluginFront" size={150} color={colors.menuBackground.hex}/>
          <Text style={overviewStyles.mainText}>{ lang("Crownstones_require_rooms") }</Text>
          <Text style={overviewStyles.subText}>{ lang("Ask_the_admin_of_this_SphHandle") }</Text>
        </View>
      )
    }


    let shouldShowStatusCommunication = noStones === false && this.props.arrangingRooms === false

    return (
      <View style={{width: screenWidth, flex:1}}>
        { shouldShowStatusCommunication ? <StatusCommunication sphereId={currentSphere} viewingRemotely={viewingRemotely} opacity={0.5}  /> : undefined }
        <RoomLayer
          viewId={this.props.viewId}
          sphereId={currentSphere}
          viewingRemotely={viewingRemotely}
          multipleSpheres={this.props.multipleSpheres}
          zoomOutCallback={this.props.zoomOutCallback}
          setRearrangeRooms={this.props.setRearrangeRooms}
          arrangingRooms={this.props.arrangingRooms}
        />
        { shouldShowStatusCommunication ? <StatusCommunication sphereId={currentSphere} viewingRemotely={viewingRemotely} opacity={0.5}  /> : undefined }
      </View>
    );
  }

}
