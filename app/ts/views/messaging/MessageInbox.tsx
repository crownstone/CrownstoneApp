import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("MessageInbox", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View, TextStyle
} from "react-native";


import {
  availableScreenHeight, background,
  colors,
  screenHeight,
  screenWidth,
  styles
} from "../styles";
import {Background} from "../components/Background";
import {IconButton} from "../components/IconButton";
import {ListEditableItems} from "../components/ListEditableItems";
import {MessageEntry} from "./MessageEntry";
import {MessageCenter} from "../../backgroundProcesses/MessageCenter";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Navigation } from "react-native-navigation";
import { ViewStateWatcher } from "../components/ViewStateWatcher";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";


export class MessageInbox extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let title =  lang("Messages");
    if (activeSphere && state.spheres[activeSphere]) {
      let sphere = state.spheres[activeSphere];
      title +=  lang("_in_",sphere.config.name);
    }

    return TopBarUtil.getOptions({title: title});
  }


  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    this.init();
  }

  init() {
    let activeSphere = this._setActiveSphere();
    if (activeSphere) {
      let state = core.store.getState();
      let sphere = state.spheres[activeSphere];
      if (sphere.state.newMessageFound) {
        MessageCenter.newMessageStateInSphere(activeSphere, false);
      }
    }
  }


  _setActiveSphere() {
    // set the active sphere if needed and setup the object variables.
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;

    let sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name - state.spheres[a].config.name});

    // handle the case where we deleted a sphere that was active.
    if (state.spheres[activeSphere] === undefined) {
      activeSphere = null;
    }
    if (activeSphere === null && sphereIds.length > 0) {
      core.store.dispatch({type:"SET_ACTIVE_SPHERE", data: {activeSphere: sphereIds[0]}});
      return sphereIds[0];
    }

    return activeSphere;
  }



  componentDidMount() {
    this.checkForMessages();
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.changeStones       ||
        change.changeMessage      ||
        change.updateActiveSphere ||
        change.changeSphereState
      ) {
        this.checkForMessages();
        this.forceUpdate();
      }
    });
  }

  checkForMessages() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    if (activeSphere) {
      let sphere = state.spheres[activeSphere];
      if (sphere.state.newMessageFound) {
        Navigation.mergeOptions(this.props.componentId, {
          bottomTab: {
            badge: '1'
          }
        })
      }
    }
  }

  clearMessageBadge() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    if (activeSphere) {
      MessageCenter.newMessageStateInSphere(activeSphere, false);
    }
    Navigation.mergeOptions(this.props.componentId, {
      bottomTab: {
        badge: null
      }
    });
  }


  componentWillUnmount() {
    this.clearMessageBadge();
    this.unsubscribeStoreEvents();
  }

  _getMessages() {
    let items = [];

    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;

    let sphere = state.spheres[activeSphereId];

    let messageIds = Object.keys(sphere.messages);
    if (messageIds.length > 0) {
      items.push({label: lang("MESSAGES"), type: 'explanation',  below:false});

      let messages = [];

      messageIds.forEach((messageId) => {
        messages.push({message: sphere.messages[messageId], id: messageId});
      });

      messages.sort((a,b) => { return b.message.config.updatedAt - a.message.config.updatedAt; });
      messages.forEach((messageData) => {
        let message = messageData.message;
        let backgroundColor = colors.white.rgba(0.75);
        let read = true;
        if (message.received[state.user.userId] && message.read[state.user.userId] === undefined) {
          read = false;
          backgroundColor = colors.green.hex;
        }

        items.push({__item:
          <View style={[styles.listView,{backgroundColor: backgroundColor, paddingRight:0, paddingLeft:0}]}>
            <MessageEntry
              store={core.store}
              message={message}
              read={read}
              messageId={messageData.id}
              sphere={sphere}
              sphereId={activeSphereId}
              self={state.user}
              size={45}
              deleteMessage={ () => { core.store.dispatch({type:'REMOVE_MESSAGE', sphereId: activeSphereId, messageId: messageData.id}) }}
            />
          </View>
        })
      });
    }

    return items;
  }

  render() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let messageExplanationStyle : TextStyle = {
      color: colors.csBlueDarker.hex,
      textAlign: 'center',
      paddingLeft: 30,
      backgroundColor:"transparent",
      paddingRight: 30,
      fontWeight: 'bold',
      fontStyle:'italic'
    };

    if (activeSphere && state.spheres[activeSphere]) {
      let sphere = state.spheres[activeSphere];

      let stonesAvailable = Object.keys(sphere.stones).length > 0;
      if (stonesAvailable) {
        let iconSize = 0.14*screenHeight;
        let items = this._getMessages();

        let iconButton = (
          <TouchableOpacity
            onPress={() => { NavigationUtil.launchModal( "MessageAdd",{ sphereId: activeSphere }); }}
          >
            <IconButton
              name="ios-mail"
              size={iconSize*0.85}
              color="#fff"
              addIcon={true}
              buttonSize={iconSize}
              buttonStyle={{backgroundColor:colors.csBlueDark.hex, borderRadius: 0.2*iconSize}}
            />
          </TouchableOpacity>
        );

        let headerText = <Text style={textStyle.specification}>{ lang("You_can_leave_messages_in") }</Text>;

        let scrollView;
        if (items.length > 0) {
          scrollView = (
            <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
              <View style={{flex:1, minHeight: availableScreenHeight,  width: screenWidth, alignItems:'center'}}>
                <View style={{height: 0.3*iconSize}} />
                { headerText }
                <View style={{height: 0.4*iconSize}} />
                { iconButton }
                <View style={{height: 0.1*iconSize}} />
                <ListEditableItems key="empty" items={items} style={{width:screenWidth}} />
                <View style={{height: 0.4*iconSize}} />
              </View>
            </ScrollView>
          );
        }
        else {
          scrollView = (
            <ScrollView style={{height: availableScreenHeight, width: screenWidth}}>
              <View style={{flex:1, minHeight: availableScreenHeight, width: screenWidth, alignItems:'center'}}>
                <View style={{height: 0.3*iconSize}} />
                { headerText }
                <View style={{height: 0.4*iconSize}} />
                { iconButton }
                <View style={{height: 0.6*iconSize}} />
                <Text style={messageExplanationStyle}>{ lang("Tap_the_envelope_icon_to_") }</Text>
                <View style={{flex:2}} />
              </View>
            </ScrollView>
          );
        }

        return (
          <BackgroundNoNotification image={background.lightBlur}>
            <ViewStateWatcher componentId={ this.props.componentId } onBlur={ () => { this.clearMessageBadge(); }} />
            { scrollView }
          </BackgroundNoNotification>
        );
      }
      else {
        return (
          <BackgroundNoNotification image={background.lightBlur}>
            <ViewStateWatcher componentId={ this.props.componentId } onBlur={ () => { this.clearMessageBadge(); }} />
            <View style={{flex:1}} />
            <Text style={messageExplanationStyle}>{ lang("Add_some_Crownstones_to_u") }</Text>
            <View style={{flex:1}} />
          </BackgroundNoNotification>
        );
      }
    }
    else {
      return (
        <BackgroundNoNotification image={background.lightBlur}>
          <ViewStateWatcher componentId={ this.props.componentId } onBlur={ () => { this.clearMessageBadge(); }} />
          <View style={{flex:1}} />
          <Text style={messageExplanationStyle}>{ lang("Add_a_Sphere_to_use_messa") }</Text>
          <View style={{flex:1}} />
        </BackgroundNoNotification>
      );
    }
  }
}


export const textStyle = StyleSheet.create({
  title: {
    color:colors.csBlueDarker.hex,
    fontSize:30,
    paddingBottom:10,
    fontWeight:'bold'
  },
  explanation: {
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    paddingLeft:25,
    paddingRight:25,
  },
  case: {
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
  },
  value: {
    color:colors.csBlueDarker.hex,
    textAlign:'center',
    fontSize:15,
    fontWeight:'bold'
  },
  specification: {
    backgroundColor:"transparent",
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:15,
    padding:15,
    fontWeight:'bold'
  },
});