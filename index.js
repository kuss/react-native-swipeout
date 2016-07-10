import tweenState from 'react-tween-state';
import NativeButton from './NativeButton';
import styles from './styles';
import reactMixin from 'react-mixin';

import React, { PropTypes } from 'react';

import {
  PanResponder,
  TouchableHighlight,
  StyleSheet,
  Text,
  View,
} from 'react-native';

class SwipeoutBtn extends React.Component {
  static propTypes = {
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.node,
    onPress: PropTypes.func,
    text: PropTypes.string,
    type: PropTypes.string,
    underlayColor: PropTypes.string,
  };

  static defaultProps = {
    backgroundColor: null,
    color: null,
    component: null,
    underlayColor: null,
    height: 0,
    key: null,
    onPress: null,
    disabled: false,
    text: 'Click me',
    type: '',
    width: 0,
  };

  render() {
    const btn = this.props;
    const styleSwipeoutBtn = [styles.swipeoutBtn];

    //  apply "type" styles (delete || primary || secondary)
    if (btn.type === 'delete') {
      styleSwipeoutBtn.push(styles.colorDelete);
    } else if (btn.type === 'primary') {
      styleSwipeoutBtn.push(styles.colorPrimary);
    } else if (btn.type === 'secondary') {
      styleSwipeoutBtn.push(styles.colorSecondary);
    }

    //  apply background color
    if (btn.backgroundColor) {
      styleSwipeoutBtn.push([{ backgroundColor: btn.backgroundColor }]);
    }

    styleSwipeoutBtn.push([{
      height: btn.height,
      width: btn.width,
    }]);

    const styleSwipeoutBtnComponent = [];

    //  set button dimensions
    styleSwipeoutBtnComponent.push([{
      height: btn.height,
      width: btn.width,
    }]);

    const styleSwipeoutBtnText = [styles.swipeoutBtnText];

    //  apply text color
    if (btn.color) {
      styleSwipeoutBtnText.push([{ color: btn.color }]);
    }

    return  (
      <NativeButton
        onPress={this.props.onPress}
        style={styles.swipeoutBtnTouchable}
        underlayColor={this.props.underlayColor}
        disabled={this.props.disabled}
        style={styleSwipeoutBtn}
        textStyle={styleSwipeoutBtnText}>
        {
          (btn.component ?
            <View style={styleSwipeoutBtnComponent}>{btn.component}</View>
            :
            btn.text
          )
        }
      </NativeButton>
    );
  }
}

class Swipeout extends React.Component {
  static propTypes = {
    autoClose: PropTypes.bool,
    backgroundColor: PropTypes.string,
    close: PropTypes.bool,
    left: PropTypes.array,
    onOpen: PropTypes.func,
    right: PropTypes.array,
    scroll: PropTypes.func,
    style: View.propTypes.style,
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
      autoClose: this.props.autoClose || false,
      btnWidth: 0,
      btnsLeftWidth: 0,
      btnsRightWidth: 0,
      contentHeight: 0,
      contentPos: 0,
      contentWidth: 0,
      openedRight: false,
      swiping: false,
      tweenDuration: 160,
      timeStart: null,
    };
    this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
    this.handlePanResponderMove = this.handlePanResponderMove.bind(this);
    this.handlePanResponderEnd = this.handlePanResponderEnd.bind(this);
    this.tweenContent = this.tweenContent.bind(this);
    this.rubberBandEasing = this.rubberBandEasing.bind(this);
    this.autoClose = this.autoClose.bind(this);
    this.close = this.close.bind(this);
    this.onLayout = this.onLayout.bind(this);
    this.renderButtons = this.renderButtons.bind(this);
    this.renderButton = this.renderButton.bind(this);
    this.tweenState = this.tweenState.bind(this);
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
    if (nextProps.close) {
      this.close();
    }
  }

  handlePanResponderGrant(e: Object, gestureState: Object) {
    if(this.props.onOpen){
      this.props.onOpen(this.props.sectionID, this.props.rowID);
    }
    this.refs.swipeoutContent.measure((ox, oy, width, height) => {
      this.setState({
        btnWidth: (width/5),
        btnsLeftWidth: this.props.left ? (width/5)*this.props.left.length : 0,
        btnsRightWidth: this.props.right ? (width/5)*this.props.right.length : 0,
        swiping: true,
        timeStart: (new Date()).getTime(),
      });
    });
  }

  handlePanResponderMove(e: Object, gestureState: Object) {
    const posX = gestureState.dx;
    const posY = gestureState.dy;
    const leftWidth = this.state.btnsLeftWidth;
    const rightWidth = this.state.btnsRightWidth;
    if (this.state.openedRight) {
      const posX = gestureState.dx - rightWidth;
    } else if (this.state.openedLeft) {
      const posX = gestureState.dx + leftWidth;
    }

    //  prevent scroll if moveX is true
    const moveX = Math.abs(posX) > Math.abs(posY);
    if (this.props.scroll) {
      if (moveX) {
        this.props.scroll(false);
      } else {
        this.props.scroll(true);
      }
    }
    if (this.state.swiping) {
      //  move content to reveal swipeout
      if (posX < 0 && this.props.right) {
        this.setState({ contentPos: Math.min(posX, 0) });
      } else if (posX > 0 && this.props.left) {
        this.setState({ contentPos: Math.max(posX, 0) });
      }
    }
  }

  handlePanResponderEnd(e: Object, gestureState: Object) {
    const posX = gestureState.dx;
    const contentPos = this.state.contentPos;
    const contentWidth = this.state.contentWidth;
    const btnsLeftWidth = this.state.btnsLeftWidth;
    const btnsRightWidth = this.state.btnsRightWidth;

    //  minimum threshold to open swipeout
    const openX = contentWidth*0.33;

    //  should open swipeout
    const openLeft = posX > openX || posX > btnsLeftWidth/2;
    const openRight = posX < -openX || posX < -btnsRightWidth/2;

    //  account for open swipeouts
    if (this.state.openedRight) {
      const openRight = posX-openX < -openX;
    }
    if (this.state.openedLeft) {
      const openLeft = posX+openX > openX;
    }

    //  reveal swipeout on quick swipe
    const timeDiff = (new Date()).getTime() - this.state.timeStart < 200;
    if (timeDiff) {
      const openRight = posX < -openX/10 && !this.state.openedLeft;
      const openLeft = posX > openX/10 && !this.state.openedRight;
    }

    if (this.state.swiping) {
      if (openRight && contentPos < 0 && posX < 0) {
        // open swipeout right
        this.tweenContent('contentPos', -btnsRightWidth);
        this.setState({ contentPos: -btnsRightWidth, openedLeft: false, openedRight: true });
      } else if (openLeft && contentPos > 0 && posX > 0) {
        // open swipeout left
        this.tweenContent('contentPos', btnsLeftWidth);
        this.setState({ contentPos: btnsLeftWidth, openedLeft: true, openedRight: false });
      } else {
        // close swipeout
        this.tweenContent('contentPos', 0);
        this.setState({ contentPos: 0, openedLeft: false, openedRight: false });
      }
    }

    //  Allow scroll
    if (this.props.scroll) {
      this.props.scroll(true);
    }
  }

  tweenContent(state, endValue) {
    this.tweenState(state, {
      easing: tweenState.easingTypes.easeInOutQuad,
      duration: endValue === 0 ? this.state.tweenDuration*1.5 : this.state.tweenDuration,
      endValue: endValue,
    });
  }

  rubberBandEasing(value, limit) {
    if (value < 0 && value < limit) {
      return limit - Math.pow(limit - value, 0.85);
    } else if (value > 0 && value > limit) {
      return limit + Math.pow(value - limit, 0.85);
    }
    return value;
  }

  //  close swipeout on button press
  autoClose(btn) {
    const onPress = btn.onPress;
    if (onPress) {
      onPress();
    }
    if (this.state.autoClose) {
      this.close();
    }
  }

  close() {
    this.tweenContent('contentPos', 0);
    this.setState({
      openedRight: false,
      openedLeft: false,
    });
  }

  render() {
    const contentWidth = this.state.contentWidth;
    const posX = this.getTweeningValue('contentPos');

    const styleSwipeout = [styles.swipeout, this.props.style];
    if (this.props.backgroundColor) {
      styleSwipeout.push([{ backgroundColor: this.props.backgroundColor }]);
    }

    const limit = -this.state.btnsRightWidth;
    if (posX > 0) {
      const limit = this.state.btnsLeftWidth;
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

    return (
      <View style={styleSwipeout}>
        <View
          ref="swipeoutContent"
          style={styleContent}
          onLayout={this.onLayout}
          {...this.panResponder.panHandlers}>
          {this.props.children}
        </View>
        { this.renderButtons(this.props.right, isRightVisible, styleRight) }
        { this.renderButtons(this.props.left, isLeftVisible, styleLeft) }
      </View>
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
        onPress={() => this.autoClose(btn)}
        text={btn.text}
        type={btn.type}
        underlayColor={btn.underlayColor}
        width={this.state.btnWidth}/>
    );
  }
}

Swipeout.NativeButton = NativeButton;
Swipeout.SwipeoutButton = SwipeoutBtn;
reactMixin.onClass(Swipeout, tweenState.Mixin);

export default Swipeout;
