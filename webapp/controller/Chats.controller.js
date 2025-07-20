sap.ui.define([
	"saphire/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("saphire.controller.Chats", {
		
		onInit: function () {
			this.getRouter().getRoute("home").attachPatternMatched(this.onRouteMatched, this);
		},



		onRouteMatched: function (event) {
			this._processChatData();
		},

		_processChatData: function () {
			var contactsModel = this.getModel("contactsModel");
			var sentModel = this.getModel("sentMessagesModel");
			var receivedModel = this.getModel("receivedMessagesModel");
			
			if (!contactsModel || !sentModel || !receivedModel) {
				console.error("One or more models not available");
				return;
			}
			
			var contacts = contactsModel.getData();
			var sentMessages = sentModel.getData();
			var receivedMessages = receivedModel.getData();
		
			var conversations = contacts.map(function (contact) {
				var contactSentMessages = sentMessages.filter(function (msg) {
					return msg.phone === contact.phone;
				});
				var contactReceivedMessages = receivedMessages.filter(function (msg) {
					return msg.phone === contact.phone;
				});
				
				var allMessages = contactSentMessages.concat(contactReceivedMessages);
				allMessages.sort(function (a, b) {
					var aDateParts = a.date.split('T');
					var aDateComponents = aDateParts[0].split('/');
					var aTimeParts = aDateParts[1].split(':');
					var aDate = new Date(
						parseInt(aDateComponents[2]), // year
						parseInt(aDateComponents[1]) - 1, // month (0-based)
						parseInt(aDateComponents[0]), // day
						parseInt(aTimeParts[0]), // hour
						parseInt(aTimeParts[1]) // minute
					);
					
					var bDateParts = b.date.split('T');
					var bDateComponents = bDateParts[0].split('/');
					var bTimeParts = bDateParts[1].split(':');
					var bDate = new Date(
						parseInt(bDateComponents[2]), // year
						parseInt(bDateComponents[1]) - 1, // month (0-based)
						parseInt(bDateComponents[0]), // day
						parseInt(bTimeParts[0]), // hour
						parseInt(bTimeParts[1]) // minute
					);
					
					return aDate - bDate;
				});
				
				var lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
				
				return {
					phone: contact.phone,
					contactName: contact.contactName,
					photo: contact.photo,
					lastMessage: lastMessage ? lastMessage.text : "No messages",
					lastMessageDate: lastMessage ? lastMessage.date : null,
					hasMessages: allMessages.length > 0
				};
			});
			
			conversations.sort(function (a, b) {
				if (!a.lastMessageDate) return 1;
				if (!b.lastMessageDate) return -1;
				
				var aDateParts = a.lastMessageDate.split('T');
				var aDateComponents = aDateParts[0].split('/');
				var aTimeParts = aDateParts[1].split(':');
				var aDate = new Date(
					parseInt(aDateComponents[2]), // year
					parseInt(aDateComponents[1]) - 1, // month (0-based)
					parseInt(aDateComponents[0]), // day
					parseInt(aTimeParts[0]), // hour
					parseInt(aTimeParts[1]) // minute
				);
				
				var bDateParts = b.lastMessageDate.split('T');
				var bDateComponents = bDateParts[0].split('/');
				var bTimeParts = bDateParts[1].split(':');
				var bDate = new Date(
					parseInt(bDateComponents[2]), // year
					parseInt(bDateComponents[1]) - 1, // month (0-based)
					parseInt(bDateComponents[0]), // day
					parseInt(bTimeParts[0]), // hour
					parseInt(bTimeParts[1]) // minute
				);
				
				return bDate - aDate; // Most recent first
			});
			
			this.getView().setModel(new JSONModel(conversations), "conversations");
		},

		onChatPress: function (event) {
			
			var item = event.getParameter("listItem") || event.getSource();
			
			var bindingContext = item.getBindingContext("conversations");
			
			if (bindingContext) {
				var phone = bindingContext.getProperty("phone");
				
				this.getRouter().navTo("chat", {
					chat: phone
				});
			} else {
				console.error("No binding context found");
			}
		},

		onSearch: function (event) {
			var searchValue = event.getParameter("query"); 
			var list = this.getView().byId("chatList");
			var binding = list.getBinding("items");
		
		
			if (binding) {
				var filters = [];
		
				if (searchValue) {
					// Create filter for contact name
					filters.push(new Filter({
						path: "contactName",
						operator: FilterOperator.Contains,
						value1: searchValue,
						caseSensitive: false
					}));
				}
		
				binding.filter(filters);
					}
		}
	});
});