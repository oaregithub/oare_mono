import Vue from 'vue';

export const ACTIONS = {
  REFRESH: 'refresh',
  TOAST: 'toast',
  CLOSE_TOAST: 'close',
};

const EventBus = new Vue();

export default EventBus;
