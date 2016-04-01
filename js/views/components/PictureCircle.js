import React, {
  Component,
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

var Icon = require('react-native-vector-icons/Ionicons');

import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

export class PictureCircle extends Component {
  render() {
    return (
      <View>
        <Image style={[{
          width:60,
          height:60,
          borderRadius:30,
          backgroundColor: '#ffffff',
          borderColor: this.props.color || colors.menuBackground.h,
          borderWidth: 2
          }, styles.centered]} source={this.props.picture} />
          <View style={[{
            marginTop:-61,
            marginLeft:41,
            width:22,
            height:22,
            borderRadius:11,
            backgroundColor: colors.red.h,
            borderColor: '#ffffff',
            borderWidth: 2
          }, styles.centered]}>
            <Icon name={'android-remove'} size={13} color={'#ffffff'} />
          </View>
      </View>
    );
  }
}