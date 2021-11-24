import Vue from 'vue';

export const ACTIONS = {
  TOAST: 'toast',
  CLOSE_TOAST: 'close',
  COMMENT_DIALOG: 'comment-dialog',
  EDIT_WORD_DIALOG: 'edit-word-dialog',
  SPECIAL_CHAR_INPUT: 'special-char-input',
};

const EventBus = new Vue();

export default EventBus;
