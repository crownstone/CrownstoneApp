import React, { Component } from 'react'
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { RoomOverview } from '../components/RoomOverview'
import { ListEditableItems } from './../components/ListEditableItems'
import { getStonesFromState, getSpheresWhereIHaveAccessLevel } from './../../util/dataUtil'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { TopBar } from '../components/Topbar';
import { Icon } from '../components/Icon';

export class RoomSelection extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      let state = store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        Actions.pop();
      }
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    let items = [];
    let requiredData = {sphereId: this.props.sphereId, stoneId: this.props.stoneId};

    const store = this.props.store;
    const state = store.getState();

    let rooms = state.spheres[this.props.sphereId].locations;
    let roomIds = Object.keys(rooms);
    if (roomIds.length > 0) {
      items.push({label:"ROOMS IN CURRENT SPHERE",  type:'explanation', below:false});
      roomIds.forEach((roomId) => {
        let room = rooms[roomId];
        items.push({__item:
          <TouchableHighlight key={roomId + '_entry'} onPress={() => {
            Actions.pop();
            store.dispatch({...requiredData, type: "UPDATE_STONE_LOCATION", data: {locationId: roomId}})
          }}>
            <View style={styles.listView}>
              <RoomOverview
                icon={room.config.icon}
                name={room.config.name}
                stoneCount={Object.keys(getStonesFromState(state, this.props.sphereId, roomId)).length}
                navigation={true}
              />
              </View>
            </TouchableHighlight>
        });
      })
    }
    else {
      items.push({label:"Add rooms by pressing add in the Sphere Overview",  type:'explanation', below:false});
    }

    // if ()
    items.push({label:"DECOUPLE THIS CROWNSTONE",  type:'explanation', below: false});
    items.push({
      label: 'Do not put this Crownstone in a specific room.',
      largeIcon: <Icon name="md-cube" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
      style: {color:colors.blue.hex},
      type: 'navigation',
      callback: () => {
        Actions.pop();
        store.dispatch({...requiredData, type: "UPDATE_STONE_LOCATION", data: {locationId: null}})
      }
    });
    items.push({label:"If you do not add the Crownstone to a room, it will not be used for indoor localization purposes.",  type:'explanation', below: true});

    return items;
  }

  render() {
    let backgroundImage = this.props.getBackground.call(this, 'menu');
    return (
      <Background hideInterface={true} image={backgroundImage} >
        <TopBar
          leftAction={ Actions.pop }
          title={this.props.title} />
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
