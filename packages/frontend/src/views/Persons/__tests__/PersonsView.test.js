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
    word: 'Test0',
    person: 'Test0',
    relation: 's.',
    relationPerson: 'relationPersonTest0',
    totalReferenceCount: 0,
    topValueRole: null,
  },
  {
    word: 'Test1',
    person: 'Test1',
    relation: 's.',
    label: null,
    relationPerson: 'Test1RelationPerson',
    totalReferenceCount: 1,
    topValueRole: 'Blacksmith',
  },
  {
    word: 'Test2',
    person: 'Test2',
    relationPerson: 'relationPersonTest2',
    totalReferenceCount: 2,
    topValueRole: null,
    topVariableRole: 'Father',
    roleObjUuid: 'objUuidTest2',
    roleObjPerson: 'Test2OtherPerson',
  },
  {
    word: 'Test3',
    person: 'Test3',
    relationPerson: 'relationPersonTest3',
    totalReferenceCount: 3,
    topValueRole: null,
    topVariableRole: 'This appears in red (only the admins)',
    roleObjUuid: null,
  },
  {
    word: 'Test4Label',
    person: null,
    relation: null,
    label: 'Test4Label',
    relationPerson: null,
    totalReferenceCount: 4,
    topValueRole: null,
  },
];

const mockServer = {
  getPeople: jest.fn().mockResolvedValue(testPeople),
  getPeopleCount: jest.fn().mockResolvedValue(testPeople.length),
};

const mockStore = {
  getters: {
    isAdmin: jest.fn().mockResolvedValue(true),
  },
};

const observe = jest.fn();
const unobserve = jest.fn();

const mockLetter = 'T';
const mockLimit = 50;
const mockOffset = 0;
const mockRequest = {
  letter: mockLetter,
  limit: mockLimit,
  page: mockOffset,
};
const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
  sl.set('store', mockStore);

  // v-intersect observer
  window.IntersectionObserver = jest.fn(() => ({
    observe,
    unobserve,
  }));
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
      listeners: () => null,
    });

  it('gets people and count on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getPeople).toHaveBeenCalledWith(mockRequest);
    expect(mockServer.getPeopleCount).toHaveBeenCalledWith(mockRequest.letter);
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

  it('display person texts', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const personDiv = wrapper.findAll('.test-person-row').at(0);
    const personTextsContainer = personDiv.get('.test-person-texts');
    expect(personTextsContainer.html()).toContain(
      testPeople[0].totalReferenceCount
    );
    expect(mockActions.showSnackbar).not.toHaveBeenCalled();
    await personTextsContainer.trigger('click');
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });
});
