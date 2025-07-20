sap.ui.define([
    "saphire/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "saphire/util/UIHelper"
], function (BaseController, JSONModel, UIHelper) {
    "use strict";

    return BaseController.extend("saphire.controller.Chat", {

        onInit: function () {
            this.getRouter().getRoute("chat").attachPatternMatched(this.onRouteMatched, this);
        },

        onAfterRendering: function () {
            var that = this;
            this.addKeyboardEventsToInput();
            this.getView().byId("messageList").addEventDelegate({
                onAfterRendering: function () {
                    that._scrollToBottom();
                }
            });
        },

        onRouteMatched: function (event) {
            var phone = event.getParameter("arguments").chat;
            console.log("Chat route matched for phone:", phone);
            this._currentPhone = phone;
            this._loadMessagesForContact(phone);
        },

        _loadMessagesForContact: function (phone) {
            this._processMessagesForContact(phone);
        },

        _processMessagesForContact: function (phone) {
            console.log("Processing messages for contact:", phone);

            var contacts = this.getModel("contactsModel").getData();
            var sentMessages = this.getModel("sentMessagesModel").getData();
            var receivedMessages = this.getModel("receivedMessagesModel").getData();

            var contact = contacts.find(function (c) {
                return c.phone === phone;
            });

            if (!contact) {
                return;
            }

            var contactSentMessages = sentMessages.filter(function (msg) {
                return msg.phone === phone;
            }).map(function (msg) {
                var [datePart, timePart] = msg.date.split('T');
                var [day, month, year] = datePart.split('/');
                var [hours, minutes] = timePart.split(':');

                var timestamp = new Date(year, month - 1, day, hours, minutes);

                return {
                    id: msg.id,
                    text: msg.text,
                    date: msg.date,
                    sender: "You",
                    isSent: true,
                    sent: msg.sent,
                    delivered: msg.delivered,
                    read: msg.read,
                    timestamp: timestamp
                };
            });

            var contactReceivedMessages = receivedMessages.filter(function (msg) {
                return msg.phone === phone;
            }).map(function (msg) {
                var [datePart, timePart] = msg.date.split('T');
                var [day, month, year] = datePart.split('/');
                var [hours, minutes] = timePart.split(':');

                var timestamp = new Date(year, month - 1, day, hours, minutes);

                return {
                    id: msg.id,
                    text: msg.text,
                    date: msg.date,
                    sender: contact.contactName,
                    isSent: false,
                    timestamp: timestamp
                };
            });

            var allMessages = contactSentMessages.concat(contactReceivedMessages);
            allMessages.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });

            var processedMessages = this._processMessagesWithDateSeparators(allMessages);

            this.getView().setModel(new JSONModel({
                contactName: contact.contactName,
                phone: contact.phone,
                photo: contact.photo
            }), "currentContact");

            this.getView().setModel(new JSONModel(processedMessages), "messages");

            setTimeout(function () {
                this._scrollToBottom();
            }.bind(this), 100);
        },

        _processMessagesWithDateSeparators: function(messages) {
            var processedMessages = [];
            var currentDate = null;

            messages.forEach((message, index) => {
                const messageDate = message.timestamp;
                const dateStr = messageDate.toISOString().split('T')[0];

                if (currentDate !== dateStr) {
                    processedMessages.push({
                        isDateSeparator: true,
                        dateText: this._formatDateSeparator(messageDate),
                        timestamp: messageDate
                    });
                    currentDate = dateStr;
                }

                let isGrouped = false;
                if (processedMessages.length > 0) {
                    const lastMessage = processedMessages[processedMessages.length - 1];
                    if (!lastMessage.isDateSeparator) {
                        isGrouped = (
                            lastMessage.sender === message.sender &&
                            (message.timestamp - lastMessage.timestamp) < 300000 // 5 minutes
                        );
                    }
                }

                processedMessages.push({
                    ...message,
                    isDateSeparator: false,
                    formattedTime: this._formatTime(message.timestamp),
                    isGrouped: isGrouped
                });
            });

            return processedMessages;
        },

        _formatDateSeparator: function(date) {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            today.setHours(0, 0, 0, 0);
            yesterday.setHours(0, 0, 0, 0);
            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);

            if (compareDate.getTime() === today.getTime()) {
                return "Today";
            } else if (compareDate.getTime() === yesterday.getTime()) {
                return "Yesterday";
            } else {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        },

        _formatTime: function(date) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        },


	 onPostMessage: function(event) {
		var message = event.getParameter("value");
		if (!message.trim()) {
			return;
		}

		var currentTime = new Date();

		var newMessage = {
			id: "NEW_" + Date.now(),
			text: message,
			timestamp: currentTime,
			sender: "You",
			isSent: true,
			sent: true,
			delivered: true,
			read: false,
			formattedTime: this._formatTime(currentTime),
			showTimestamp: true
		};

		var messagesModel = this.getView().getModel("messages");
		var messages = messagesModel.getData() || [];

		const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
		const newMessageDate = currentTime.toISOString().split('T')[0];
		const lastMessageDate = lastMessage ? 
			(lastMessage.timestamp ? new Date(lastMessage.timestamp).toISOString().split('T')[0] : null) : 
			null;

		if (newMessageDate !== lastMessageDate) {
			messages.push({
				isDateSeparator: true,
				dateText: this._formatDateSeparator(currentTime),
				timestamp: currentTime
			});
		}

		if (lastMessage && !lastMessage.isDateSeparator) {
			const timeDiff = currentTime - new Date(lastMessage.timestamp);
			newMessage.isGrouped = (
				lastMessage.sender === "You" && 
				timeDiff < 300000 
			);
		} else {
			newMessage.isGrouped = false;
		}

		messages.push(newMessage);

		messagesModel.setData(messages);
		messagesModel.refresh(true);

		event.getSource().setValue("");

		setTimeout(() => {
			this._scrollToBottom();
		}, 100);

		var sentMessagesModel = this.getModel("sentMessagesModel");
		var sentMessages = sentMessagesModel.getData() || [];
		sentMessages.push({
			id: newMessage.id,
			phone: this._currentPhone,
			text: message,
			date: currentTime.toISOString(),
			sent: true,
			delivered: true,
			read: false
		});
		sentMessagesModel.setData(sentMessages);
		sentMessagesModel.refresh(true);
	},

	_scrollToBottom: function () {
		var endMarker = this.getView().byId("listEndMarker");
		if (endMarker && endMarker.getDomRef()) {
			UIHelper.scrollToElement(endMarker.getDomRef(), 100);
		}
	},

	addKeyboardEventsToInput: function () {
		var input = this.getView().byId("newMessageInput");
		input.attachBrowserEvent("keydown", function (event) {
			if (event.key === "Enter" && !event.shiftKey && input.getValue().trim() !== "") {
				input.fireEvent("post", { value: input.getValue() });
				event.preventDefault();
			}
		});
	},

	// Helper method to format date for message timestamp
	formatMessageTimestamp: function(timestamp) {
		if (!timestamp) return "";
		var date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: false 
		});
	},

	// Helper method to check if message is first in group
	isFirstInGroup: function(message, messages, index) {
		if (index === 0) return true;
		if (message.isDateSeparator) return false;

		const previousMessage = messages[index - 1];
		if (previousMessage.isDateSeparator) return true;

		return previousMessage.sender !== message.sender;
	},

	// Helper method to check if message is last in group
	isLastInGroup: function(message, messages, index) {
		if (index === messages.length - 1) return true;
		if (message.isDateSeparator) return false;

		const nextMessage = messages[index + 1];
		if (nextMessage.isDateSeparator) return true;

		return nextMessage.sender !== message.sender;
	}
});
});