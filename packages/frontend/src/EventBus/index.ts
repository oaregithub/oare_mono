import Vue from 'vue';

/**
 * The actions that can be emitted on the EventBus.
 */
export const ACTIONS = {
  TOAST: 'toast',
  CLOSE_TOAST: 'close',
  COMMENT_DIALOG: 'comment-dialog',
  EDIT_WORD_DIALOG: 'edit-word-dialog',
  SPECIAL_CHAR_INPUT: 'special-char-input',
};

/**
 * The EventBus is used to communicate between components.
 */
const EventBus = new Vue();

export default EventBus;
