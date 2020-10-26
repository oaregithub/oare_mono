import EventBus, { ACTIONS } from '@/EventBus';

const showSnackbar = (text: string): void => {
  EventBus.$emit(ACTIONS.TOAST, { text });
};

const showErrorSnackbar = (text: string): void => {
  EventBus.$emit(ACTIONS.TOAST, { text, error: true });
};

const globalActions = {
  showSnackbar,
  showErrorSnackbar,
};

export type GlobalActionsType = typeof globalActions;

export default globalActions;
