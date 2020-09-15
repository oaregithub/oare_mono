import { mount } from '@vue/test-utils';
import wrapperOptions from '../wrapperOptions';
import dictionaryUnitTest from '../../src/components/DictionaryUnit';
import flushPromises from 'flush-promises';

describe('DictionaryUnit.vue', () => {
  let wrapper;
  let dictinoaryData;

  beforeAll(() => {
    dictionaryData = [
      {
        uuid: 132219054401336243167616688720503951,
        reference_uuid: '4d3c808d-5a3f-f7cc-0696-f59991f9834c',
        form: abarniū,
        spellings: [
          {
            spelling: 'a-bar-ni-ú',
            uuid: 731287658796249030177686455595770379
          },
          {
            spelling: 'TÚG-a-bar-ni-ú',
            uuid: 931535926509289875374773373820632714
          }
        ]
      },
      {
        uuid: 277845328206119847300679472757477640,
        reference_uuid: '4d3c808d-5a3f-f7cc-0696-f59991f9834c',
        form: abarnium,
        spellings: [
          {
            spelling: 'a-bar-ni-um',
            uuid: 41957795994834248220538199971
          },
          {
            spelling: 'TÚG-a-bar-ni-um',
            uuid: 517028798813151134960034162072147693
          },
          {
            spelling: 'TÚGa-bar-ni-um',
            uuid: 812417622143487962155093464226505795
          },
          {
            spelling: 'a-ba-ar-ni-um',
            uuid: 852058552417261050157975162680038400
          }
        ]
      },
      {
        uuid: 547100791908967050763907917751685999,
        reference_uuid: '4d3c808d-5a3f-f7cc-0696-f59991f9834c',
        form: abarniē,
        spellings: [
          {
            spelling: 'a-bar-ni-e',
            uuid: 9098342366235
          }
        ]
      }
    ];

    wrapper = mount(DictionaryView, {
      ...wrapperOptions,
      propsData: {
        uuid: '4d3c808d-5a3f-f7cc-0696-f59991f9834c'
      },
      mocks: {
        $axios: {
          get(path) {
            let route = path.split('/')[1];
            if (route == 'dictionary') {
              return Promise.resolve(dictionaryData);
            }
          }
        }
      }
    });
  });

  //   if("display correct title", async() => {
  //       await flushPromises();
  //       expect(wrapper.find("[data-content-"))
  //   })

  const mockDictionaryData = {
    // [
    //     {
    //         uuid: 132219054401336243167616688720503951,
    //         reference_uuid: "4d3c808d-5a3f-f7cc-0696-f59991f9834c",
    //         form: abarniū,
    //         spellings: [
    //             {
    //                 spelling: "a-bar-ni-ú",
    //                 uuid: 731287658796249030177686455595770379
    //             },
    //             {
    //                 spelling: "TÚG-a-bar-ni-ú",
    //                 uuid: 931535926509289875374773373820632714
    //             }
    //         ]
    //     },
    //     {
    //         uuid: 277845328206119847300679472757477640,
    //         reference_uuid: "4d3c808d-5a3f-f7cc-0696-f59991f9834c",
    //         form: abarnium,
    //         spellings: [
    //             {
    //                 spelling: "a-bar-ni-um",
    //                 uuid: 41957795994834248220538199971
    //             },
    //             {
    //                 spelling: "TÚG-a-bar-ni-um",
    //                 uuid: 517028798813151134960034162072147693
    //             },
    //             {
    //                 spelling: "TÚGa-bar-ni-um",
    //                 uuid: 812417622143487962155093464226505795
    //             },
    //             {
    //                 spelling: "a-ba-ar-ni-um",
    //                 uuid: 852058552417261050157975162680038400
    //             }
    //         ]
    //     },
    //     {
    //         uuid: 547100791908967050763907917751685999,
    //         reference_uuid: "4d3c808d-5a3f-f7cc-0696-f59991f9834c",
    //         form: abarniē,
    //         spellings: [
    //             {
    //                 spelling: "a-bar-ni-e",
    //                 uuid: 9098342366235
    //             }
    //         ]
    //     }
    // ]
  };

  test('set up test', () => {
    expect(true).toBe(true);
  });
});
