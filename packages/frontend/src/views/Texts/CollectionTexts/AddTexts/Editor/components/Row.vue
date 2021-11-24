<template>
  <v-hover v-slot="{ hover }">
    <v-row class="ma-1 test-row-content">
      <v-col cols="1" class="px-1 pb-1 pt-0" align="center" align-self="end">
        <span v-if="row.line">{{ formatLineNumber(row) }}</span>
      </v-col>
      <v-col cols="10" class="pa-0">
        <v-container v-if="row.type === 'Line'" class="pa-0 ma-0">
          <v-row
            v-if="row.signs && row.signs.length > 0"
            class="pa-0 ma-0 mb-1"
            align="center"
          >
            <div
              v-for="(sign, index) in row.signs"
              :key="index"
              class="text-h5"
              :class="{ 'pr-2': sign.post === ' ' }"
            >
              <v-row
                class="pa-0 ma-0"
                align="center"
                :class="{ 'selected-sign': index === row.selectedSign }"
              >
                <v-img
                  v-if="sign.type === 'image'"
                  :src="
                    require(`@oare/frontend/src/assets/signVectors/${sign.code}.png`)
                  "
                  height="25px"
                  :width="
                    getWidth(
                      require(`@oare/frontend/src/assets/signVectors/${sign.code}.png`)
                    ) || 30
                  "
                  contain
                  class="d-inline-block"
                />
                <span
                  v-else-if="sign.type === 'utf8'"
                  class="my-n1 mx-1 cuneiform"
                  >{{ getSignHTMLCode(sign.code || '') }}</span
                >
                <v-icon v-else-if="!sign.type" small color="red" class="ma-1"
                  >mdi-block-helper</v-icon
                >
              </v-row>
              <v-row
                class="pa-0 text-body-2 ma-0 grey--text"
                justify="space-between"
              >
                <span>{{ ' ' }} </span>
                <span>
                  {{ sign.reading || '' }}
                </span>
                <span>
                  {{ sign.post && sign.post !== '*' ? sign.post : ' ' }}
                </span>
              </v-row>
            </div>
          </v-row>
          <v-row class="pa-0 ma-0">
            <v-textarea
              placeholder="Enter line text here"
              auto-grow
              dense
              rows="1"
              class="mx-1 mt-0 mb-n5 hide-line test-line-text"
              :autofocus="autofocus"
              @keydown.enter.prevent
              @keyup.enter="$emit('add-row-after')"
              @input="updateText($event)"
              @keyup="updateSignSelection($event)"
              @click="updateSignSelection($event)"
              @focus="setFocused"
              @blur="resetSignSelection"
              :value="row.text"
              ref="textareaRef"
            />
          </v-row>
        </v-container>
        <v-row
          class="pa-0 ma-0"
          v-else-if="
            row.type === 'Broken Line(s)' ||
            row.type === 'Uninscribed Line(s)' ||
            row.type === 'Ruling(s)'
          "
        >
          <v-col v-show="row.isEditing" cols="2" class="ma-0 pa-0">
            <v-combobox
              class="mx-1 mt-n1 mb-n3 pt-0"
              hide-details
              :items="getRegionItems(row.type)"
              @input="setLineValue($event.value || $event)"
              single-line
              placeholder="Select"
            />
          </v-col>
          <span
            v-if="row.type === 'Ruling(s)'"
            v-show="!row.isEditing"
            class="mr-1"
            >{{ row.lineValue ? formatRuling(row.lineValue) : 'Single' }}</span
          >
          <span v-else v-show="!row.isEditing" class="mr-1"
            >{{ row.lineValue || 1 }}
          </span>
          <v-col cols="4" class="ma-0 pa-0">
            <span class="my-1"
              >{{ `${row.type}` }}
              <a @click="toggleRowEditing()" v-if="!row.isEditing" class="ml-4"
                >Edit</a
              >
            </span>
          </v-col>
        </v-row>
        <span v-else class="my-1">{{ row.type }}</span>
      </v-col>
      <v-col cols="1" class="pa-0" align="right">
        <v-btn @click="$emit('remove-row')" icon x-small class="ma-1">
          <v-icon :color="hover ? 'red' : 'transparent'">mdi-delete</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-hover>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  nextTick,
  onMounted,
  watch,
} from '@vue/composition-api';
import { RowWithLine } from './Column.vue';
import { formatLineNumber as defaultLineFormatter } from '@oare/oare';
import sl from '@/serviceLocator';
import { v4 } from 'uuid';
import {
  SignCode,
  SignCodeWithUuid,
  SignCodeWithDiscourseUuid,
  EditorWord,
  RowTypes,
} from '@oare/types';
import SpecialChars from './SpecialChars.vue';
import EventBus, { ACTIONS } from '@/EventBus';

export default defineComponent({
  props: {
    row: {
      type: Object as PropType<RowWithLine>,
      required: true,
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
    isCurrentRow: {
      type: Boolean,
      default: false,
    },
  },
  components: { SpecialChars },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const textareaRef = ref();

    const formatLineNumber = (row: RowWithLine) => {
      if ((!row.lineValue && row.line) || (row.line && row.lineValue === 1)) {
        return defaultLineFormatter(row.line);
      }
      if (row.lineValue && row.line) {
        const formattedFirstNumber = defaultLineFormatter(
          row.line - row.lineValue + 1,
          false
        );
        const formattedLastNumber = defaultLineFormatter(row.line);
        return `${formattedFirstNumber} - ${formattedLastNumber}`;
      }
    };

    const getWidth = (src: string) => {
      const image = new Image();
      image.src = src;
      const heightRatio = 25 / image.height;
      return heightRatio * image.width;
    };

    const getSignHTMLCode = (code: string) => {
      let codePt = Number(`0x${code}`);
      if (codePt > 0xffff) {
        codePt -= 0x10000;
        return String.fromCharCode(
          0xd800 + (codePt >> 10),
          0xdc00 + (codePt & 0x3ff)
        );
      } else {
        return String.fromCharCode(codePt);
      }
    };

    const resetSignSelection = () => {
      focused.value = false;
      emit('reset-new-row');
      emit('update-row-content', {
        ...props.row,
        selectedSign: undefined,
      });
    };

    const cursorIndex = ref(0);
    const updateSignSelection = async (event: any) => {
      if (event.key !== 'Enter') {
        const rowText: string = event.srcElement.value;
        cursorIndex.value = event.srcElement.selectionStart;
        if (!cursorIndex.value) {
          emit('update-row-content', {
            ...props.row,
            selectedSign: 0,
          });
        } else {
          const textBeforeCursor = rowText.slice(0, cursorIndex.value);
          const originalSigns = textBeforeCursor.split(/[\s\-.]+/);
          const formattedSigns = await Promise.all(
            originalSigns.map(sign => {
              if (sign !== '') {
                return server.getFormattedSign(sign);
              }
              return [''];
            })
          );
          const signs = formattedSigns.flat();
          emit('update-row-content', {
            ...props.row,
            selectedSign: signs.length - 1,
          });
        }
      }
    };

    const toggleRowEditing = () => {
      emit('update-row-content', {
        ...props.row,
        isEditing: true,
      });
    };

    const updateText = (text: string) => {
      emit('update-row-content', {
        ...props.row,
        text,
      });
      getSigns(text);
    };

    const getSigns = async (rowText: string) => {
      const matches = rowText.match(/\(([^)]+)\)/g);
      let matchesText: string[] = [];
      if (matches) {
        matchesText = matches.map(text => {
          return `${text.slice(1, text.length - 1)}*`;
        });
        matchesText.forEach(matchText => {
          rowText = rowText.replace(/\(([^)]+)\)/, matchText);
        });
      }

      const wordsText = rowText.split(/[\s]+/).filter(word => word !== '');
      const signsByWord = await Promise.all(
        wordsText.map(async word => {
          try {
            const originalSigns = word
              .split(/[\-.*]+/)
              .filter(sign => sign !== '');
            const formattedSigns = await Promise.all(
              originalSigns.map(sign => server.getFormattedSign(sign))
            );
            const signs = formattedSigns.flat();

            const originalDividers = word
              .split('')
              .filter(sign => sign.match(/[\-.*]+/));
            const visibleDividers: string[] = [];
            formattedSigns.forEach((signPieces, idx) => {
              if (signPieces.length > 1) {
                for (let i = 1; i < signPieces.length; i += 1) {
                  visibleDividers.push('+');
                }
              }
              visibleDividers.push(originalDividers[idx]);
            });

            const urlDividers = visibleDividers.map(div => {
              if (div !== '*') {
                return 'notAsterisk';
              }
              return div;
            });

            const signCodes: SignCode[] = await Promise.all(
              signs.map((sign, idx) =>
                server.getSignCode(sign, urlDividers[idx])
              )
            );
            const signCodesWithUuids: SignCodeWithUuid[] = signCodes.map(
              code => ({
                ...code,
                uuid: v4(),
              })
            );
            const signCodesWithDividers: SignCodeWithUuid[] =
              signCodesWithUuids.map((code, idx) => {
                return {
                  ...code,
                  post: visibleDividers[idx] || undefined,
                  reading: signs[idx],
                };
              });
            return signCodesWithDividers;
          } catch {
            actions.showErrorSnackbar(
              'Error generating signs. Please try again.'
            );
            return [];
          }
        })
      );

      const words: EditorWord[] = signsByWord.map(word => {
        let spelling = '';
        word.forEach(sign => {
          if (sign.post === '*') {
            spelling += `(${sign.value || ''})`;
          } else {
            spelling += `${sign.value || ''}${sign.post || ''}`;
          }
        });
        return {
          discourseUuid: v4(),
          spelling,
        };
      });

      const signs: SignCodeWithDiscourseUuid[] = signsByWord.flatMap(
        (word, idx) => {
          const signs = word.map(sign => ({
            ...sign,
            discourseUuid: words[idx].discourseUuid,
          }));
          return signs;
        }
      );
      emit('update-row-content', {
        ...props.row,
        signs,
        words,
      });
    };

    const getRegionItems = (type: RowTypes) => {
      if (type === 'Ruling(s)') {
        return ['Single', 'Double', 'Triple'];
      }
      return [1, 2, 3, 4, 5, 6, 7, 8];
    };

    const formatRuling = (value: number) => {
      switch (value) {
        case 1:
          return 'Single';
        case 2:
          return 'Double';
        case 3:
          return 'Triple';
        default:
          return value;
      }
    };

    const setLineValue = (value: string) => {
      if (value === 'Single') {
        value = '1';
      } else if (value === 'Double') {
        value = '2';
      } else if (value === 'Triple') {
        value = '3';
      }
      emit('update-row-content', {
        ...props.row,
        lineValue: Number(value),
        isEditing: false,
      });
    };

    const insertChar = async (delineator: string) => {
      const originalRowText = props.row.text || '';
      const textBeforeCursor = originalRowText.slice(0, cursorIndex.value);
      const textAfterCursor = originalRowText.slice(cursorIndex.value);
      const newText = `${textBeforeCursor}${delineator}${textAfterCursor}`;
      updateText(newText);
      cursorIndex.value += 1;
      textareaRef.value.focus();
      const input = textareaRef.value.$el.querySelector('textarea');
      await nextTick();
      input.setSelectionRange(cursorIndex.value, cursorIndex.value);
    };

    const focused = ref(false);
    const setFocused = () => {
      focused.value = true;
      emit('set-current-row');
    };
    watch(focused, () => {
      emit('set-focused', focused.value);
    });

    onMounted(() => {
      emit('set-current-row');
      EventBus.$on(ACTIONS.SPECIAL_CHAR_INPUT, (char: string) => {
        if (props.isCurrentRow) {
          insertChar(char);
        }
      });
    });

    return {
      formatLineNumber,
      getWidth,
      getSignHTMLCode,
      resetSignSelection,
      updateSignSelection,
      toggleRowEditing,
      updateText,
      getRegionItems,
      getSigns,
      formatRuling,
      setLineValue,
      insertChar,
      textareaRef,
      focused,
      setFocused,
    };
  },
});
</script>

<style scoped>
.hide-line >>> .v-input__slot::before {
  border-style: none !important;
}

.cuneiform {
  font-family: 'Santakku', 'CuneiformComposite';
}

.selected-sign {
  box-shadow: 0px -2px 0px gold inset;
}
</style>