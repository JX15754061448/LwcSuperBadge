import { LightningElement, wire, api, track } from 'lwc';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { refreshApex } from '@salesforce/apex';
import { publish, MessageContext } from 'lightning/messageService';
import BoatMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { updateRecord } from 'lightning/uiRecordApi';
const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';
const columns = [
    {label: 'Name', fieldName: 'Name', type: 'text', editable: true},
    {label: 'Length', fieldName: 'Length__c', type: 'number', editable: true},
    {label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true},
    {label: 'Desription', fieldName: 'Description__c', type: 'text', editable: true},
];
export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  columns = columns;
  boatTypeId = '';
  boats;
  isLoading = false;

  // wired message context
  @wire(MessageContext) messageContext;
  // wired getBoats method
  @wire (getBoats, {boatTypeId:'$boatTypeId'})
  wiredBoats({data}) {
    this.boats = data;
    this.isLoading = false;
    this.notifyLoading(this.isLoading);

    console.log('===>this.boats：' + this.boats);
  }

  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api searchBoats(boatTypeId) {
    console.log('==>searchBoats boatTypeId:' + boatTypeId);
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    this.boatTypeId = boatTypeId;
   }

  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
  async refresh() {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    await refreshApex(this.boats);
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
    console.log('==>this.boats：' + this.boats);
   }

  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
      this.selectedBoatId = event.detail.boatId;
      this.sendMessageService(this.selectedBoatId);
   }

  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    // explicitly pass boatId to the parameter recordId
    publish(this.messageContext, BoatMC, { recordId : boatId });
  }

  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    this.notifyLoading(true);
    // const updatedFields = event.detail.draftValues;
    // // Update the records via Apex
    // updateBoatList({boats: updatedFields})
    // .then(() => {
    //     this.refresh();
    //     this.showToast(SUCCESS_TITLE, MESSAGE_SHIP_IT, SUCCESS_VARIANT);
    // })
    // .catch(error => {
    //     this.showToast(ERROR_TITLE, error.detail.message, ERROR_VARIANT);
    // })
    // .finally(() => {});
    const recordInputs = event.detail.draftValues.slice().map(draft=>{
                  const fields = Object.assign({}, draft);
                  return {fields};
    });

    console.log(recordInputs);
    const promises = recordInputs.map(recordInput => updateRecord(recordInput));
    Promise.all(promises).then(res => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: SUCCESS_TITLE,
                message: MESSAGE_SHIP_IT,
                variant: SUCCESS_VARIANT
            })
        );
        this.draftValues = [];
        return this.refresh();
    }).catch(error => {
          this.error = error;
          this.dispatchEvent(
              new ShowToastEvent({
                  title: ERROR_TITLE,
                  message: CONST_ERROR,
                variant: ERROR_VARIANT
              })
          );
          this.notifyLoading(false);
    }).finally(() => {
          this.draftValues = [];
      });
  }

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant,
    });
    this.dispatchEvent(event);
}
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
    if (isLoading) {
        this.dispatchEvent(new CustomEvent('loading'));
    } else {
        this.dispatchEvent(CustomEvent('doneloading'));
    }
   }
}