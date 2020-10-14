import Vue from 'vue';

export const ACTIONS = {
  REFRESH: 'refresh',
  TOAST: 'toast',
};

const EventBus = new Vue();

export default EventBus;
