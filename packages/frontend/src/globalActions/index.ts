import EventBus, { ACTIONS } from '@/EventBus';

export const showSnackbar = (text: string) => {
  EventBus.$emit(ACTIONS.TOAST, { text });
};

export const showErrorSnackbar = (text: string) => {
  EventBus.$emit(ACTIONS.TOAST, { text, error: true });
};
