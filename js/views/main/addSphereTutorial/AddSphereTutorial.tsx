
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddSphereTutorial", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';
import { Background } from "../../components/Background";
import { availableModalHeight, colors, screenWidth} from "../../styles";
import { AddSphereTutorial_introduction } from "./elements/AddSphereTutorial_introduction";
import { AddSphereTutorial_multiple } from "./elements/AddSphereTutorial_multiple";
import { AddSphereTutorial_intended } from "./elements/AddSphereTutorial_intended";
import { core } from "../../../core";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";

export class AddSphereTutorial extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({ title: lang("New_Sphere"), closeModal: true});
  }

  _carousel;

  constructor(props) {
    super(props);

    this.state = {activeSlide: 0};
  }

  _renderItem({item, index}) {
    return item;
  }


  render() {
    let components = this._getContent();
    return (
      <Background hasNavBar={false} image={core.background.detailsDark}>
        <View style={{height: availableModalHeight, width:screenWidth}}>
        <Carousel
          useScrollView={true}
          ref={(c) => { this._carousel = c; }}
          data={components}
          removeClippedSubviews={false /* THIS IS REQUIRED IF WE HAVE THIS ELEMENT ON A MODAL OR THE FIRST SLIDE WONT RENDER */}
          renderItem={this._renderItem}
          sliderWidth={screenWidth}
          itemWidth={screenWidth}
          onSnapToItem={(index) => this.setState({ activeSlide: index }) }
        />
        <HiddenFadeInView visible={this.state.activeSlide !== components.length - 1} style={{position:'absolute', bottom:0, width:screenWidth}}>
          <Pagination
            dotsLength={components.length}
            activeDotIndex={this.state.activeSlide}
            containerStyle={{ backgroundColor: colors.black.rgba(0.3 )}}
            dotStyle={{
              width: 10,
              height: 10,
              borderRadius: 5,
              marginHorizontal: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.92)'
            }}
            inactiveDotStyle={{
              // Define styles for inactive dots here
            }}
            inactiveDotOpacity={0.4}
            inactiveDotScale={0.6}
          />
        </HiddenFadeInView>
        </View>
      </Background>
    )
  }


  _getContent() {
    let content = [];
    content.push(<AddSphereTutorial_introduction key="AddSphereTutorial_introduction" />);
    content.push(<AddSphereTutorial_multiple     key="AddSphereTutorial_multiple" />);
    content.push(<AddSphereTutorial_intended     key="AddSphereTutorial_intended" store={core.store} />);
    return content;
  }
}
