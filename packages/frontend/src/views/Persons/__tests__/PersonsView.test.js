import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import PersonsView from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const mockActions = {
  showErrorSnackbar: jest.fn(),
  showSnackbar: jest.fn(),
};

const testPeople = [
  {
    uuid: 'uuid',
    word: 'Test0',
    personUuid: 'test0',
    person: 'Test0',
    relation: 's.',
    relationPersonUuid: 'relationPersonTest0Uuid',
    relationPerson: 'relationPersonTest0',
    topValueRole: null,
    label: 'Test0Label',
    textOccurrenceCount: 2,
  },
  {
    uuid: 'uuid',
    word: 'Test1',
    personUuid: 'test1',
    person: 'Test1',
    relation: 's.',
    label: null,
    relationPerson: 'Test1RelationPerson',
    topValueRole: 'Blacksmith',
    textOccurrenceCount: 2,
  },
  {
    uuid: 'uuid',
    word: 'Test2',
    person: 'Test2',
    personUuid: 'test2',
    relationPerson: 'relationPersonTest2',
    topValueRole: null,
    topVariableRole: 'Father',
    roleObjUuid: 'objUuidTest2',
    roleObjPerson: 'Test2OtherPerson',
    textOccurrenceCount: 2,
  },
  {
    uuid: 'uuid',
    word: 'Test3',
    person: 'Test3',
    personUuid: 'test3',
    relationPerson: 'relationPersonTest3',
    topValueRole: null,
    topVariableRole: 'This appears in red (only the admins)',
    roleObjUuid: null,
    textOccurrenceCount: 2,
  },
  {
    uuid: 'uuid',
    word: 'Test4Label',
    personUuid: 'test4',
    person: null,
    relation: null,
    label: 'Test4Label',
    relationPerson: null,
    topValueRole: null,
    textOccurrenceCount: 2,
  },
];

const testTextOccurrences = [
  {
    textName: 'Text1',
    readings: ['<strong>1. This is text 1</strong>'],
  },
  {
    textName: 'Text2',
    readings: ['<strong>2. This is text 2</strong>'],
  },
];

const mockServer = {
  getPeople: jest.fn().mockResolvedValue(testPeople),
  getPersonTextOccurrencesCount: jest.fn(),
  getPersonTextOccurrences: jest.fn().mockResolvedValue(testTextOccurrences),
};

const mockStore = {
  getters: {
    isAdmin: jest.fn().mockResolvedValue(true),
    permissions: [
      {
        name: 'DISCONNECT_SPELLING',
      },
    ],
  },
};

const mockLodash = {
  debounce: cb => cb,
};

const mockLetter = 'T';
const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
  sl.set('store', mockStore);
  sl.set('lodash', mockLodash);
};

beforeEach(setup);

describe('PersonsView test', () => {
  const createWrapper = () =>
    mount(PersonsView, {
      vuetify,
      localVue,
      propsData: {
        letter: mockLetter,
      },
      stubs: ['router-link'],
    });

  it('gets people and count on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getPeople).toHaveBeenCalledWith(mockLetter);
  });

  it('shows snackbar when people retrieval fails', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      getPeople: jest
        .fn()
        .mockRejectedValue('Error, unable to retrieve people.'),
    });
    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('find person with relation and relationPerson', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const personDiv = wrapper.findAll('.test-person-row').at(0);
    expect(personDiv.html()).toContain(testPeople[0].person);
    expect(personDiv.html()).toContain(testPeople[0].relation);
    expect(personDiv.html()).toContain(testPeople[0].relationPerson);
    expect(personDiv.html()).not.toContain(testPeople[1].person);
  });

  it('find person with value role', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const personDiv = wrapper.findAll('.test-person-row').at(1);
    const valueRoleSpan = personDiv.get('.test-role-value');
    expect(valueRoleSpan.html()).toContain(testPeople[1].topValueRole);
  });

  it('find person with variable role and person associated with it', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const personDiv = wrapper.findAll('.test-person-row').at(2);
    const variableRoleSpan = personDiv.get('.test-role-variable');
    expect(variableRoleSpan.html()).toContain(testPeople[2].topVariableRole);
    expect(variableRoleSpan.html()).toContain(testPeople[2].roleObjPerson);
  });

  it('find person without variable role and value role displaying in error text', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const personDiv = wrapper.findAll('.test-person-row').at(3);
    const variableRoleSpan = personDiv.get('.test-role-variable-error');
    expect(variableRoleSpan.html()).toContain(testPeople[3].topVariableRole);
  });

  it('find person with relation but only as a label', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const personDiv = wrapper.findAll('.test-person-row').at(4);
    expect(personDiv.html()).toContain(testPeople[4].label);
    expect(personDiv.html()).not.toContain(testPeople[0].person);
  });

  it('display person text occurrences', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const personDiv = wrapper.findAll('.test-person-row').at(1);
    await personDiv.get('.test-text-occurrences').trigger('click');
    await flushPromises();
    expect(mockServer.getPersonTextOccurrences).toHaveBeenCalled();
    const isDisplayed = wrapper
      .findAll('.test-text-occurrences-display')
      .exists();
    expect(isDisplayed).toBe(true);
  });
});
