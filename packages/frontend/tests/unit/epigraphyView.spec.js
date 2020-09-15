import { mount } from '@vue/test-utils';
import wrapperOptions from '../wrapperOptions';
import flushPromises from 'flush-promises';
import EpigraphyView from '../../src/components/EpigraphyView';

describe('NewEpigraphyView.vue', () => {
  const epigraphyResp = {
    text_name: 'Text Name',
    text_uuid: 'uuid',
    collection: {
      uuid: 'col_uuid',
      name: 'Collection'
    },
    units: []
  };
  let wrapper;
  beforeAll(() => {
    wrapper = mount(EpigraphyView, {
      ...wrapperOptions,
      propsData: {
        textUuid: 'text_uuid'
      },
      mocks: {
        $axios: {
          get(path) {
            let route = path.split('/')[1];
            if (route === 'text_epigraphies') {
              return Promise.resolve({ data: epigraphyResp });
            }
          }
        }
      }
    });
  });

  it('correctly shows link back to collection', async () => {
    await flushPromises();
    expect(wrapper.find('[data-collection-link]').text()).toContain(
      epigraphyResp.collection.name
    );
  });
});
