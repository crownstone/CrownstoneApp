import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeBus }    from '../../native/libInterface/NativeBus'
import { Icon }         from '../components/Icon'
import { OverlayBox }   from '../components/overlays/OverlayBox'
import { styles, colors , screenHeight, screenWidth } from '../styles'
import { Bluenet } from "../../native/libInterface/Bluenet";

export class LocationPermissionOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();

    this.state = {
      visible: false,
      notificationType: 'unknown' //"unknown", "off", "foreground", "on"
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    NativeBus.on(NativeBus.topics.locationStatus, (status) => {
      switch (status) {
        case "off":
          this.setState({visible: true, notificationType: status});
          break;
        case "foreground":
          this.setState({visible: true, notificationType: status});
          break;
        case "on":
          this.setState({visible: false, notificationType: status});
          break;
        default: // "unknown":
          this.setState({visible: this.state.visible, notificationType: status});
          break;
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getTitle() {
    switch (this.state.notificationType) {
      case "foreground":
        return "Only foreground permissions granted.";
      case "on":
        return "Location Services are on!";
      case "off":
        return "Location Services are disabled.";
      default: // "unknown":
        return "Starting Location Services ...";
    }
  }

  _getText() {
    switch (this.state.notificationType) {
      case "foreground":
        return "Crownstone cannot react to your presence while the app is in the background with this permission.";
      case "on":
        return "Everything is great!";
      case "off":
        return "Without location services, Crownstones cannot respond to your location and the app can\'t communicate with Crownstones correctly. This permission is required for the app to function.";
      default: // "unknown":
        return "This should not take long!";
    }
  }
  _getButton() {
    switch (this.state.notificationType) {
      case "foreground":
      case "off":
        return (
          <TouchableOpacity
            onPress={() => { Bluenet.requestLocationPermission() }}
            style={[styles.centered, {
              width: 0.4 * screenWidth,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.blue.rgba(0.5),
            }]}>
            <Text style={{fontSize: 12, color: colors.blue.hex}}>{"Request Permission"}</Text>
          </TouchableOpacity>
        );
    }
  }


  render() {
    return (
      <OverlayBox visible={this.state.visible} height={0.7*screenHeight}>
        <View style={{flex:1}} />
        <Icon
          name="ios-navigate"
          size={Math.min(0.30*screenHeight, 0.5*screenWidth)}
          color={colors.blue.hex}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.blue.hex, padding:5, textAlign:'center'}}>{this._getTitle()}</Text>
        <Text style={{fontSize: 11, fontWeight: '400',  color: colors.blue.hex, padding:5, textAlign:'center'}}>
          {this._getText()}
        </Text>
        <View style={{flex:1}} />
        {this._getButton()}
      </OverlayBox>
    );
  }
}