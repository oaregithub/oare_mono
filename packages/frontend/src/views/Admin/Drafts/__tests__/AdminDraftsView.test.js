import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AdminDraftsView from '../AdminDraftsView.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AdminDraftsView test', () => {
  const draft = {
    createdAt: new Date(),
    textName: 'My text',
    textUuid: 'text-uuid',
    updatedAt: new Date('Mar 22, 2021, 2:26 PM'),
    uuid: 'draft-uuid',
    notes: 'text note',
    content: [
      {
        side: 'obv.',
        text: 'my draft',
      },
    ],
    user: {
      firstName: 'John',
      lastName: 'Doe',
      uuid: 'user-uuid',
    },
  };
  const server = {
    getAllDrafts: jest.fn().mockResolvedValue({
      totalDrafts: 1,
      drafts: [draft],
    }),
  };

  const actions = {
    showErrorSnackbar: jest.fn(),
  };

  beforeEach(() => {
    sl.set('serverProxy', server);
    sl.set('globalActions', actions);
  });

  const createWrapper = () =>
    mount(AdminDraftsView, {
      localVue,
      vuetify,
      stubs: ['router-link'],
    });

  it('displays drafts', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.html()).toContain(draft.textName);
    expect(wrapper.html()).toContain('John Doe');
    expect(wrapper.html()).toContain('Mar 22, 2021, 2:26 PM');
  });

  it('clicking on View Content opens dialog', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('.test-view-content').trigger('click');
    expect(wrapper.find('.test-content-dialog').exists()).toBe(true);
  });
});
