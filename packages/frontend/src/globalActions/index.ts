import EventBus, { ACTIONS } from '@/EventBus';

const showSnackbar = (text: string) => {
  EventBus.$emit(ACTIONS.TOAST, { text });
};

const showErrorSnackbar = (text: string) => {
  EventBus.$emit(ACTIONS.TOAST, { text, error: true });
};

export default {
  showSnackbar,
  showErrorSnackbar,
};
