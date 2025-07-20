sap.ui.define([], function () {
	"use strict";

	/**
	 * @namespace saphire.formatter
	 */
	var ChatFormatter = {
		/**
		 * Returns the appropriate icon for the sender
		 * @param {string} sender - The sender type
		 * @returns {string} The icon path
		 */
		senderIcon: function (sender) {
			// For team chat, show user icon for "You" and person icon for others
			return sender === "You" ? "sap-icon://tnt/user" : "sap-icon://tnt/user";
		},

		/**
		 * Determines if an item should be visible in the list
		 * @param {string} id - The item ID
		 * @returns {boolean} True if item should be visible
		 */
		itemIsVisibleInList: function (id) {
			return !!id;
		},

		/**
		 * Formats the user photo path
		 * @param {string} photoPath - The photo path from JSON
		 * @returns {string} The correct photo path
		 */
		formatUserPhoto: function (photoPath) {
			if (!photoPath) {
				return "";
			}
			// Return the path as is since it's already correctly formatted
			return photoPath;
		},

		/**
		 * Formats the last message date for display
		 * @param {string} dateStr - The date string in DD/MM/YYYYTHH:MM format
		 * @returns {string} Formatted date
		 */
		formatLastMessageDate: function (dateStr) {
			if (!dateStr) {
				return "";
			}
			
			// Handle DD/MM/YYYY format
			var dateParts = dateStr.split('T');
			var datePart = dateParts[0]; // "26/01/2022"
			var timePart = dateParts[1]; // "12:00"
			
			var dateComponents = datePart.split('/');
			var day = parseInt(dateComponents[0]);
			var month = parseInt(dateComponents[1]) - 1; // JS months are 0-based
			var year = parseInt(dateComponents[2]);
			
			var date = new Date(year, month, day, parseInt(timePart.split(':')[0]), parseInt(timePart.split(':')[1]));
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			var messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			
			var diffTime = today.getTime() - messageDate.getTime();
			var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			
			if (diffDays === 0) {
				// Today - show time
				return date.toLocaleTimeString('en-US', { 
					hour: '2-digit', 
					minute: '2-digit',
					hour12: false 
				});
			} else if (diffDays === 1) {
				// Yesterday
				return "Yesterday";
			} else if (diffDays <= 7) {
				// This week - show day name
				return date.toLocaleDateString('en-US', { weekday: 'short' });
			} else {
				// Older - show date
				return date.toLocaleDateString('en-US', { 
					month: 'short', 
					day: 'numeric' 
				});
			}
		},

		/**
		 * Formats message time for display
		 * @param {string} dateStr - The date string in DD/MM/YYYYTHH:MM format
		 * @returns {string} Formatted time
		 */
		formatMessageTime: function (dateStr) {
			if (!dateStr) {
				return "";
			}
			
			// Handle DD/MM/YYYY format
			var dateParts = dateStr.split('T');
			var datePart = dateParts[0]; // "26/01/2022"
			var timePart = dateParts[1]; // "12:00"
			
			var dateComponents = datePart.split('/');
			var day = parseInt(dateComponents[0]);
			var month = parseInt(dateComponents[1]) - 1; // JS months are 0-based
			var year = parseInt(dateComponents[2]);
			
			var date = new Date(year, month, day, parseInt(timePart.split(':')[0]), parseInt(timePart.split(':')[1]));
			
			return date.toLocaleTimeString('en-US', { 
				hour: '2-digit', 
				minute: '2-digit',
				hour12: false 
			});
		},

		/**
		 * Gets the delivery status icon color
		 * @param {boolean} read - Message read status
		 * @param {boolean} delivered - Message delivered status
		 * @param {boolean} sent - Message sent status
		 * @returns {string} Icon color
		 */
		getDeliveryStatusColor: function (read, delivered, sent) {
			if (!sent) return "lightgray";
			if (read) return "#0078d4"; // Blue for read
			if (delivered) return "gray"; // Gray for delivered but not read
			return "lightgray"; // Light gray for sent but not delivered
		},

		/**
		 * Truncates long messages for preview
		 * @param {string} text - The message text
		 * @param {number} maxLength - Maximum length (default 50)
		 * @returns {string} Truncated text
		 */
		truncateMessage: function (text, maxLength) {
			if (!text) return "";
			maxLength = maxLength || 50;
			if (text.length <= maxLength) return text;
			return text.substring(0, maxLength) + "...";
		}
	};

	return ChatFormatter;
});