import { mount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import OareDataTable from '../OareDataTable.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('OareDataTable', () => {
  const headers = [
    {
      text: 'Name',
      value: 'name',
    },
    {
      text: 'Age',
      value: 'age',
    },
  ];

  const items = [
    {
      name: 'Jeff',
      age: 15,
    },
    {
      name: 'Amy',
      age: 22,
    },
  ];

  const actions = {
    showErrorSnackbar: jest.fn(),
  };

  const fetchItems = jest.fn().mockResolvedValue();

  const createWrapper = (props = {}) =>
    mount(OareDataTable, {
      vuetify,
      localVue,
      propsData: {
        headers,
        items,
        defaultSort: 'name',
        fetchItems,
        ...props,
      },
    });

  beforeEach(() => {
    sl.set('globalActions', actions);
  });

  it('should render', () => {
    const wrapper = createWrapper();

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('fetches items when performing sort', async () => {
    const wrapper = createWrapper();
    await wrapper.findAll('th').at(0).trigger('click');
    await flushPromises();

    expect(fetchItems).toHaveBeenCalled();
  });

  it('shows error if fetching items fails', async () => {
    const errorMessage = 'Fetching items failed';
    createWrapper({
      errorMessage,
      fetchItems: jest.fn().mockRejectedValue('could not fetch items'),
    });

    await flushPromises();
    expect(actions.showErrorSnackbar).toHaveBeenCalled();
  });
});
