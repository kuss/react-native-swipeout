import { Motion, spring, presets } from 'react-motion';
import SwipeoutBtn from './swipeoutBtn';
import styles from './styles';

import React, { PropTypes } from 'react';

import {
  View,
  PanResponder,
} from 'react-native';

class Swipeout extends React.Component {
  static propTypes = {
    style: View.propTypes.style,
    close: PropTypes.bool,

    // button specific props
    left: PropTypes.array,
    right: PropTypes.array,
    closeOnPressButton: PropTypes.bool,

    // over swipe specifig props
    leftOver: PropTypes.bool,
    rightOver: PropTypes.bool,
    shrinkOnOverSwipe: PropTypes.bool,

    onOpen: PropTypes.func,
    didOpen: PropTypes.func,

    onScroll: PropTypes.func,
    sensitivity: PropTypes.number,
  };

  static defaultProps = {
    rowID: -1,
    sectionID: -1,
    sensitivity: 0,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      contentWidth: 0,
      contentHeight: 0,
      contentPos: 0,
      contentEndPos: 0,

      openedLeft: false,
      openedRight: false,
      enableLeft: this.props.left || this.props.rightOver || false,
      enableRight: this.props.right || this.props.leftOver || false,

      motionStart: null,
      touching: false,
      swiping: false,
      shrinking: false,
      disappeared: false,

      fullLeftWidth: 0,
      fullLeftRight: 0,

      // button specific
      btnWidth: 0,
      closeOnPressButton: this.props.closeOnPressButton || false,
    };

    this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
    this.handlePanResponderMove = this.handlePanResponderMove.bind(this);
    this.handlePanResponderEnd = this.handlePanResponderEnd.bind(this);

    this.rubberBandEasing = this.rubberBandEasing.bind(this);

    this.close = this.close.bind(this);
    this.onLayout = this.onLayout.bind(this);

    this.renderButtons = this.renderButtons.bind(this);
    this.renderButton = this.renderButton.bind(this);
    this.onPressBtn = this.onPressBtn.bind(this);

    this.onRest = this.onRest.bind(this);
  }

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onMoveShouldSetPanResponder: (event, gestureState) =>
        Math.abs(gestureState.dx) > this.props.sensitivity &&
        Math.abs(gestureState.dy) > this.props.sensitivity,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd,
      onShouldBlockNativeResponder: (event, gestureState) => true,
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.left && nextProps.rightOver) {
      throw new Error("Swipeout props: left and rightOver cannot be assigned at once")
    }
    if (nextProps.right && nextProps.leftOver) {
      throw new Error("Swipeout props: right and leftOver cannot be assigned at once")
    }

    if (nextProps.close) {
      this.close();
    }
  }

  handlePanResponderGrant(e: Object, gestureState: Object) {
    if (this.props.onOpen) {
      this.props.onOpen(this.props.sectionID, this.props.rowID);
    }
    this.swipeoutContent.measure((ox, oy, width, height) => {
      let btnWidth = width / 5;
      let fullLeftWidth = 0;
      if (this.props.left) {
        fullLeftWidth = btnWidth * this.props.left.length;
      } else if (this.props.rightOver) {
        fullLeftWidth = width;
      }

      let fullRightWidth = 0;
      if (this.props.right) {
        fullRightWidth = btnWidth * this.props.right.length;
      } else if (this.props.leftOver) {
        fullRightWidth = width;
      }

      this.setState({
        btnWidth,
        fullLeftWidth,
        fullRightWidth,
        touching: true,
        motionStart: (new Date()).getTime(),
      });
    });
  }

  handlePanResponderMove(e: Object, gestureState: Object) {
    let posX = gestureState.dx;
    let posY = gestureState.dy;

    const leftWidth = this.state.fullLeftWidth;
    const rightWidth = this.state.fullRightWidth;
    if (this.state.openedRight) {
      posX = gestureState.dx - rightWidth;
    } else if (this.state.openedLeft) {
      posX = gestureState.dx + leftWidth;
    }

    //  prevent scroll if moveX is true
    const moveX = Math.abs(posX) > Math.abs(posY);
    if (this.props.onScroll) {
      if (moveX) {
        this.props.onScroll(false);
      } else {
        this.props.onScroll(true);
      }
    }

    if (this.state.touching) {
      //  move content to reveal swipeout
      if (posX < 0 && this.state.enableRight) {
        this.setState({ contentPos: Math.min(posX, 0) });
      } else if (posX > 0 && this.state.enableLeft) {
        this.setState({ contentPos: Math.max(posX, 0) });
      }
    }
  }

  handlePanResponderEnd(e: Object, gestureState: Object) {
    const posX = gestureState.dx;
    const contentPos = this.state.contentPos;
    const contentWidth = this.state.contentWidth;
    const fullLeftWidth = this.state.fullLeftWidth;
    const fullRightWidth = this.state.fullRightWidth;

    //  minimum threshold to open swipeout
    const openX = contentWidth*0.33;

    //  should open swipeout
    let openLeft = posX > openX || posX > fullLeftWidth/2;
    let openRight = posX < -openX || posX < -fullRightWidth/2;

    //  account for open swipeouts
    if (this.state.openedRight) {
      openRight = posX-openX < -openX;
    }
    if (this.state.openedLeft) {
      openLeft = posX+openX > openX;
    }

    //  reveal swipeout on quick swipe
    const timeDiff = (new Date()).getTime() - this.state.motionStart < 200;
    if (timeDiff) {
      openRight = posX < -openX/10 && !this.state.openedLeft;
      openLeft = posX > openX/10 && !this.state.openedRight;
    }

    if (this.state.touching) {
      if (openRight && contentPos < 0 && posX < 0) {
        // open swipeout right
        this.setState({ contentPos: -fullRightWidth, contentEndPos: -fullRightWidth, openedLeft: false, openedRight: true, swiping: true, touching: false });
      } else if (openLeft && contentPos > 0 && posX > 0) {
        // open swipeout left
        this.setState({ contentPos: fullLeftWidth, contentEndPos: fullLeftWidth, openedLeft: true, openedRight: false, swiping: true, touching: false });
      } else {
        // close swipeout
        this.setState({ contentPos: 0, contentEndPos: 0, openedLeft: false, openedRight: false, swiping: true, touching: false});
      }
    }

    //  Allow scroll
    if (this.props.onScroll) {
      this.props.onScroll(true);
    }
  }

  rubberBandEasing(value, limit) {
    if (value < 0 && value < limit) {
      return limit - Math.pow(limit - value, 0.85);
    } else if (value > 0 && value > limit) {
      return limit + Math.pow(value - limit, 0.85);
    }
    return value;
  }

  close() {
    this.setState({
      swiping: true,
      contentEndPos: 0,
      contentPos: 0,
      openedRight: false,
      openedLeft: false,
    });
  }

  onRest() {
    let shrinking = this.state.shrinking;
    let contentHeight = this.state.contentHeight;
    let disappeared = this.state.disappeared;

    if (this.props.shrinkOnOverSwipe) {
      if (this.state.openedLeft || this.state.openedRight) {
        shrinking = true;
      }
      if (this.state.shrinking) {
        shrinking = false;
        disappeared = true;
        contentHeight = 0;
      }
    }

    this.setState({
      shrinking,
      swiping: false,
      disappeared,
      contentHeight,
    });

    if (this.props.didOpen) {
      this.props.didOpen(true);
    }

    if (this.motion) {
      this.motion.startAnimationIfNecessary();
    }
  }

  render() {
    if (this.state.disappeared) {
      return ( <View/> );
    }

    const contentWidth = this.state.contentWidth;
    const contentHeight = this.state.contentHeight;

    let motionStyle = { x: this.state.contentPos, height: contentHeight };
    if (!this.state.touching && this.state.swiping) {
      motionStyle.x = spring(this.state.contentEndPos, presets.gentle);
    }
    if (this.state.shrinking) {
      motionStyle.height = spring(0, presets.gentle);
    }

    return (
      <Motion style={motionStyle} onRest={this.onRest} ref={(c) => this.motion = c}>
        {({ x, height })  => {
          const posX = x;

          if (height < 1) {
            height = 0;
          }

          let limit = -this.state.fullRightWidth;
          if (posX > 0) {
            limit = this.state.fullLeftWidth;
          }

          const styleLeftPos = {
            left: {
              left: 0,
              overflow: 'hidden',
              width: Math.min(limit*(posX/limit), limit),
            },
          };
          const styleRightPos = {
            right: {
              left: Math.abs(contentWidth + Math.max(limit, posX)),
              right: 0,
            },
          };
          const styleContentPos = {
            content: {
              left: this.rubberBandEasing(posX, limit),
            },
          };

          const styleContent = [styles.swipeoutContent];
          styleContent.push(styleContentPos.content);

          const styleRight = [styles.swipeoutBtns];
          styleRight.push(styleRightPos.right);

          const styleLeft = [styles.swipeoutBtns];
          styleLeft.push(styleLeftPos.left);

          const isRightVisible = posX < 0;
          const isLeftVisible = posX > 0;

          const styleSwipeout = [styles.swipeout, this.props.style];
          styleSwipeout.push({ height });

          return (
            <View style={styleSwipeout}>
              <View
                ref={(c) => this.swipeoutContent = c}
                style={styleContent}
                onLayout={this.onLayout}
                {...this.panResponder.panHandlers}>
                {this.props.children}
              </View>
            { this.renderButtons(this.props.right, isRightVisible, styleRight) }
            { this.renderButtons(this.props.left, isLeftVisible, styleLeft) }
            </View>
          );
        }}
      </Motion>
    );
  }

  onLayout(event) {
    const { width, height } = event.nativeEvent.layout;
    this.setState({
      contentWidth: width,
      contentHeight: height,
    });
  }

  renderButtons(buttons, isVisible, style) {
    if (buttons && isVisible) {
      return (
        <View style={style}>
          { buttons.map(this.renderButton) }
        </View>
      );
    } else {
      return (
        <View/>
      );
    }
  }

  renderButton(btn, i) {
    return (
      <SwipeoutBtn
        backgroundColor={btn.backgroundColor}
        color={btn.color}
        component={btn.component}
        disabled={btn.disabled}
        height={this.state.contentHeight}
        key={i}
        onPress={() => this.onPressBtn(btn)}
        text={btn.text}
        type={btn.type}
        underlayColor={btn.underlayColor}
        width={this.state.btnWidth}/>
    );
  }

  // close swipeout on button press
  onPressBtn(btn) {
    const onPress = btn.onPress;
    if (onPress) {
      onPress();
    }
    if (this.state.closeOnPressButton) {
      this.close();
    }
  }
}

export default Swipeout;
