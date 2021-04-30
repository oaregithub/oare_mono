import Vue from 'vue';

export const ACTIONS = {
  TOAST: 'toast',
  CLOSE_TOAST: 'close',
};

const EventBus = new Vue();

export default EventBus;
