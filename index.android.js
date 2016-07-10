/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

import React from 'react';
import {
  AppRegistry,
  StyleSheet,
  ListView,
  Text,
  View,
} from 'react-native';

//  include react-native-swipeout
import Swipeout from './index';

//  example row data (see for json structure)
import rows from './example/data';

//  example styles
import styles from './example/styles'

//  example swipout app
class Swipeout extends React.Component {
  constructor(props, context) {
    super(props, context);

    const ds = new ListView.DataSource({rowHasChanged: (row1, row2) => true})
    this.state = {
      dataSource: ds.cloneWithRows(rows),
      scrollEnabled: true,
    };
    this.allowScroll = this.allowScroll.bind(this);
    this.handleSwipeout = this.handleSwipeout.bind(this);
    this.updateDataSource = this.updateDataSource.bind(this);
    this.renderRow = this.renderRow.bind(this);
  }

  allowScroll(scrollEnabled) {
    this.setState({ scrollEnabled })
  }

  handleSwipeout(sectionID, rowID) {
    // set active swipeout item
    for (let i = 0; i < rows.length; i++) {
      if (i != rowID) rows[i].active = false
      else rows[i].active = true
    }
    this.updateDataSource(rows)
  }

  updateDataSource(data) {
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(data)
    })
  }

  renderRow(rowData: string, sectionID: number, rowID: number) {
    return (
      <Swipeout
        left={rowData.left}
        right={rowData.right}
        rowID={rowID}
        sectionID={sectionID}
        autoClose={rowData.autoClose}
        backgroundColor={rowData.backgroundColor}
        close={!rowData.active}
        onOpen={(sectionID, rowID) => this.handleSwipeout(sectionID, rowID)}
        scroll={event => this.allowScroll(event)}>
        <View style={styles.li}>
          <Text style={styles.liText}>{rowData.text}</Text>
        </View>
      </Swipeout>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.statusbar}/>
        <View style={styles.navbar}><Text style={styles.navbarTitle}>Swipeout</Text></View>
        <ListView
          scrollEnabled={this.state.scrollEnabled}
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
          style={styles.listview}/>
      </View>
    );
  }
})

AppRegistry.registerComponent('swipeout', () => swipeout);
