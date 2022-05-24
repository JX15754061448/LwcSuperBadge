import { LightningElement, api, wire, track } from 'lwc';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// imports
const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
  @api boatTypeId;
  @track mapMarkers = [];
  @track isLoading = true;
  @track isRendered = false;
  latitude;
  longitude;

  // Add the wired method from the Apex Class
  // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
  // Handle the result and calls createMapMarkers
  @wire(getBoatsByLocation, {latitude:'$latitude', longitude:'$longitude', boatTypeId:'$boatTypeId'})
  wiredBoatsJSON({error, data}) {
      console.log('==>data:' + data);
      if (data) {
          this.createMapMarkers(JSON.parse(data));
      }
      if(error) {
          this.dispatchEvent(new ShowToastEvent({
              title: ERROR_TITLE,
              message: error.body.message,
              variant: ERROR_VARIANT
          }));
      }
      this.isLoading = false;
   }

  // Controls the isRendered property
  // Calls getLocationFromBrowser()
  renderedCallback() {
      if (this.isRendered = false) {
        this.getLocationFromBrowser();
      }
      this.isRendered = true;
   }

  // Gets the location from the Browser
  // position => {latitude and longitude}
  getLocationFromBrowser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position)=>{
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
        });
      }
   }

  // Creates the map markers
  createMapMarkers(boatData) {
     // const newMarkers = boatData.map(boat => {...});
     // newMarkers.unshift({...});
     console.log('==>boatData:' + boatData);

     this.mapMarkers = boatData.map(boat => {
          return {
            location: { Latitude: boat.Geolocation__Latitude__s, Longitude: boat.Geolocation__Longitude__s },
            title: boat.Name,
            description: `Coords: ${Latitude}, ${Longitude}`
          }
     });
     this.mapMarkers.unshift({
        location: { Latitude: this.latitude, Longitude: this.longitude },
        title: LABEL_YOU_ARE_HERE,
        icon: ICON_STANDARD_USER,
        description: `Coords: ${Latitude}, ${Longitude}`
      });
      this.isLoading = false;
      console.log('==>newMarkers:' + newMarkers);
   }
}
