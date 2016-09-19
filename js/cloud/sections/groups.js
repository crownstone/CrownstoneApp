import RNFS from 'react-native-fs'
import { LOG } from '../../logging/Log'

export const groups = {

  /**
   *
   * @returns {*}
   */
  getGroups: function (options = {}) {
    return this._setupRequest('GET', '/users/{id}/groups', options);
  },

  getUsers: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/users', options);
  },

  getAdmins: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/owner', options).then((result) => {return [result]});
  },

  getMembers: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/members', options);
  },

  getGuests: function (options = {}) {
    return this._setupRequest('GET', '/Groups/{id}/guests', options);
  },

  getKeys: function() {
    return this._setupRequest('GET','users/{id}/keys');
  },

  /**
   *
   * @param groupName
   */
  createGroup: function(groupName) {
    return this._setupRequest('POST', 'users/{id}/groups', {data:{name:groupName}}, 'body');
  },

  getUserPicture(groupId, email, userId) {
    let toPath = RNFS.DocumentDirectoryPath + '/' + userId + '.jpg';
    return this.forGroup(groupId)._download({
      endPoint:'/Groups/{id}/profilePic',
      data: {email: email},
      type: 'query'
    }, toPath);
  },


  getGroupData: function(selfId) {
    let groupId = this._groupId;

    let promises     = [];

    let applianceData= [];
    let stoneData    = [];
    let locationData = [];
    let adminData    = [];
    let memberData   = [];
    let guestData    = [];

    // for every group we get the crownstones
    promises.push(
      this.getStonesInGroup()
        .then((stones) => {
          stoneData = stones;
        })
    );

    // for every group we get the appliances
    promises.push(
      this.getAppliancesInGroup()
        .then((appliances) => {
          applianceData = appliances;
        })
    );

    // for every group, we get the locations
    promises.push(
      this.getLocations()
        .then((locations) => {
          locationData = locations;
        })
    );

    promises.push(
      this.getUserFromType(this.getAdmins.bind(this),  'admin',  adminData,  groupId, selfId)
    );

    promises.push(
      this.getUserFromType(this.getMembers.bind(this), 'member', memberData, groupId, selfId)
    );

    promises.push(
      this.getUserFromType(this.getGuests.bind(this),  'guest',  guestData,  groupId, selfId)
    );

    return Promise.all(promises).then(() => {
      LOG("returning all")
      return {
        appliances: applianceData,
        stones:     stoneData,
        locations:  locationData,
        admins:     adminData,
        members:    memberData,
        guests:     guestData,
      }
    })
  },

  getUserFromType: function(userGetter, type, userData, groupId, selfId) {
    return userGetter()
      .then((users) => {
        let profilePicturePromises = [];
        users.forEach((user) => {
          userData[user.id] = user;
          userData[user.id].accessLevel = type;
          if (user.id !== selfId) {
            profilePicturePromises.push(
              this.getUserPicture(groupId, user.email, user.id).then((filename) => {
                userData[user.id].picture = filename;
              })
            );
          }
          return Promise.all(profilePicturePromises);
        })
      })
  },

  changeGroupName: function(groupName) {
    return this._setupRequest('PUT', '/Groups/{id}', {name:groupName}, 'body');
  },

  changeUserAccess: function(userId, accessLevel) {
    // TODO: fix when correct endpoint has been added
    // return this._setupRequest('PUT', '/Groups/{id}/users/rel/' + userId, {role:accessLevel}, 'body');

    return new Promise((resolve, reject) => {
      resolve();
    })
  },

  deleteGroup: function() {
    let groupId = this._groupId;

    let promises     = [];

    let applianceData= [];
    let stoneData    = [];
    let locationData = [];

    promises.push(
      this.getStonesInGroup()
        .then((stones) => {
          stoneData = stones;
        })
    );

    // for every group we get the appliances
    promises.push(
      this.getAppliancesInGroup()
        .then((appliances) => {
          applianceData = appliances;
        })
    );

    // for every group, we get the locations
    promises.push(
      this.getLocations()
        .then((locations) => {
          locationData = locations;
        })
    );

    return Promise.all(promises)
      .then(() => {
        let deletePromises = [];
        applianceData.forEach((appliance) => {
          deletePromises.push(this.deleteAppliance(appliance.id));
        });

        stoneData.forEach((stone) => {
          deletePromises.push(this.deleteStone(stone.id));
        });

        locationData.forEach((location) => {
          deletePromises.push(this.deleteLocation(location.id));
        });

        return Promise.all(deletePromises);
      })
      .then(() => {
        return this._deleteGroup(groupId);
      })
  },

  _deleteGroup: function(groupId) {
    return this._setupRequest(
      'DELETE',
      'Groups/' + groupId
    );
  },

};