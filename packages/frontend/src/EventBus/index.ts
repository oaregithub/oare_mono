import Vue from 'vue';

/**
 * The actions that can be emitted by the EventBus.
 */
export const ACTIONS = {
  TOAST: 'toast',
  CLOSE_TOAST: 'close',
  COMMENT_DIALOG: 'comment-dialog',
  EDIT_WORD_DIALOG: 'edit-word-dialog',
  SPECIAL_CHAR_INPUT: 'special-char-input',
};

/**
 * Initializes the EventBus used for application-wide event handling.
 */
const EventBus = new Vue();

export default EventBus;
