import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AddTextEditor from '../AddTextEditor.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddTextEditor test', () => {
  const mockServer = {
    getFormattedSign: jest.fn().mockResolvedValue(['TÚG']),
    getSignCode: jest.fn().mockResolvedValue({
      uuid: 'test-uuid',
      signUuid: 'test-sign-uuid',
      readingUuid: 'test-reading-uuid',
      type: 'image',
      code: '1',
      post: '-',
      sign: 'test-sign',
      reading: 'test-reading',
      value: 'test-value',
      readingType: 'logogram',
    }),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(AddTextEditor, {
      vuetify,
      localVue,
    });
  };

  it('gets signs when typed in line', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-add-side').trigger('click');
    await wrapper.findAll('.test-side-option').at(0).trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.findAll('.test-insert-option').at(0).trigger('click');
    const lineText = wrapper.get('.test-line-text textarea');
    await lineText.setValue('TUG2');
    await lineText.trigger('keyup.a');
    await flushPromises();
    expect(mockServer.getFormattedSign).toHaveBeenCalled();
    expect(mockServer.getSignCode).toHaveBeenCalled();
  });

  it('displays error when getting formatted signs fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getFormattedSign: jest.fn().mockRejectedValue(),
      },
    });
    await wrapper.get('.test-add-side').trigger('click');
    await wrapper.findAll('.test-side-option').at(0).trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.findAll('.test-insert-option').at(0).trigger('click');
    const lineText = wrapper.get('.test-line-text textarea');
    await lineText.setValue('TUG2');
    await lineText.trigger('keyup.a');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays error when getting sign codes fails', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getSignCode: jest.fn().mockRejectedValue(),
      },
    });
    await wrapper.get('.test-add-side').trigger('click');
    await wrapper.findAll('.test-side-option').at(0).trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.findAll('.test-insert-option').at(0).trigger('click');
    const lineText = wrapper.get('.test-line-text textarea');
    await lineText.setValue('TUG2');
    await lineText.trigger('keyup.a');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('automatically adds prime numbering after broken areas', async () => {
    const wrapper = createWrapper();
    await wrapper.get('.test-add-side').trigger('click');
    await wrapper.findAll('.test-side-option').at(0).trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.findAll('.test-insert-option').at(0).trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.findAll('.test-insert-option').at(4).trigger('click');
    await wrapper.get('.test-insert-button').trigger('click');
    await wrapper.findAll('.test-insert-option').at(0).trigger('click');
    const line1 = wrapper.findAll('.test-row-content').at(0);
    expect(line1.html()).toContain('1.');
    const line2 = wrapper.findAll('.test-row-content').at(1);
    expect(line2.html()).toContain('Broken Area');
    const line3 = wrapper.findAll('.test-row-content').at(2);
    expect(line3.html()).toContain("1'");
  });
});
