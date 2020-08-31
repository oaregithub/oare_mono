# oare

This is the official package maintaned by the creators of [oarelite.org](https://oarelite.org). This code is the property of Brigham Young University.

The purpose of the `oare` package is aid in the display of epigraphic rendering and markup of ancient Assyrian debt records. Given an array of epigraphic units (and optionally markups), `oare` can display the entire text or individual line readings. The returned display is also configurable - readings can be returned as plaintext or as text suitable to be displayed in HTML.

# Text Renderer

The package supports displaying an array of epigraphic units in a readable format. Conventions for displaying Assyrian tablet readings vary, but for this project, the following conventions are used (visible when displayed as HTML):

* Phonograms are italicized
* Two phonograms are separated by a hyphen
* A logogram and any other unit are separated by a period
* Two numbers are separated by a plus sign

First, an array of **EpigraphicUnit**s is required to create an **Epigraphy** object (**EpigraphicUnit**'s definition is in `index.d.ts` if using Typescript).

Each **EpigraphicUnit** must have the following properties:

| Property | Type | Required | Description |
|---------------|----------------------------------------------------------------------------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------|
| uuid | string | **yes** | UUID of the unit as stored in the database. Will eventually be deprecated but is required for now. |
| side | string (EpigraphicUnitSide if using TS) One of: 'obv.', 'lo.e.', 'rev.',  'u.e.', 'le.e.', 'r.e.' | **yes** | The side of the tablet the unit appears on. |
| column | number | **yes** | The column of the tablet the unit appears on. |
| line | number | **yes** | The line number the unit appears on |
| charOnLine | number | **yes** | Order of the character on its line |
| charOnTablet | number | **yes** | Order of the character on the tablet |
| discourseUuid | string or null | **yes** |  UUID of the discourse the character belongs to. Will be deprecated, but is required for now. |
| reading | string | **yes** | The actual reading of the character. |
| type | string (EpigraphicUnitType if using TS) One of: 'phonogram', 'logogram', 'number', 'determinative' | **yes** | The character type. Determines its separator. |
| value | number or null | **yes** | Will only be numeric if the character represents a number,  in which case `value` will be the number the character represents. |

Optionally, an array of `MarkupUnit`s may be passed in as well. Each markup unit should correspond to a specific unit in the `EpigraphicUnit` array.

Each `MarkupUnit` must have the following format:

| Property | Type | Required | Description |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| referenceUuid | string | **yes** | Should match the `uuid` on an epigraphic unit.<br>Will eventually be deprecated in favor of matching<br>the charOnTablet instead. |
| type | string (or MarkupType if using Typescript).<br>One of: 'isCollatedReading', 'alternateSign',<br>'isEmendedReading', 'erasure', 'isUninterpreted',<br>'isWrittenWithinPrevSign', 'missing', 'signEmended',<br>'superfluous', 'uncertain', 'isWrittenAsLigature',<br>'missingSigns', 'damage', 'partialDamage' | **yes** | The type of the markup. This affects how the<br><br>corresponding epigraphic unit will be rendered. |
| value | number or null | **yes** | <br>Required if the type is 'missingSigns', otherwise<br>it should be null.<br>Will eventually be renamed in favor of `value` so<br>it can be accessed via JS dot notation. |
| startChar | number or null | **yes** | Only affects types 'damage' and 'partialDamage'.<br><br>Will be null if the previous epigraphic unit is<br>also damaged, or if the bracket should be placed<br>at the beginning of the character. |
| endChar | number or null | **yes** | Only affects types 'damage' and 'partialDamage'.<br><br>Will be null if the next epigraphic unit is also<br>damaged, or if the bracket should be placed at the<br>end of the character. |

## Usage

`oare` contains a factory function `createTabletRenderer` that creates a text epigraphy renderer according to the supplied options.

### createTabletRenderer(epigraphicUnits: EpigraphicUnit[], markupUnits: MarkupUnit[], options?: CreateTabletRendererOptions): TabletRenderer

__epigraphicUnits__: (__required__) An array of `EpigraphicUnit`, as described above

__markupUnits__: (__required__) An array of `MarkupUnit`, as described above.

__options__: (optional) Used to alter the output of the renderer. `options` is an object that can have the following properties:

| Property | Type | Default | Accepted Values | Description |
|-----------------|---------|-----------|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| __lineNumbers__ | boolean | false | true, false | Set to true if each<br>line should have a line<br>number preceding it. |
| __textFormat__ | string | 'regular' | 'regular', 'html' | 'regular' will add no special<br>markup. 'html' will italicize<br>phonograms with `<em>` tags<br>and superscript determinatives<br>with `<sup>` tags |

### Example

```js
import { createTabletRenderer } from "oare";

const epigraphicUnits = [...];
const markupUnits = [...];

const renderer = createTabletRenderer(epigraphicUnits, markupUnits);

console.log(renderer.tabletReading());

/* Output:

obv.
KIŠIB ku-ku-zi DUMU ṣé-eḫ-ri-ì-lí
KIŠIB LUGAL-sú-en₆ DUMU ma-ni-a
...

rev.
KIŠIB pì-lá-aḫ-a-šur DUMU a-šur-na-da
KIŠIB a-šur-ták-lá-ku DUMU e-na-ni-a
...
*/
```

## TabletRenderer

Calling `createTabletRenderer` will return a `TabletRender` object. Following is a description of its properties and methods.

### Properties

__sides: string[]__: A list of the sides on the tablet. For example, `['obv.', 'rev.']`

### Methods

__tabletReading(): string__: Returns a full reading of the tablet. Each side name is printed followed by each line of the side with markup. Individual sides are separated by a new line.

__sideReading(side: EpigraphicUnitSide): string__: Returns the side reading with each line reading separated by a new line. Acceptable arguments for `side` are 'obv.', 'lo.e.', 'rev.', 'u.e.', 'le.e.' or 're.e.'

__linesOnSide(side: EpigraphicUnitSide): number[]__: Returns a list of line numbers associated with the given side.

__lineReading(lineNum: number): string__: The line reading of the given line number.

__getEpigraphicUnits(): EpigraphicUnit[]__: Returns the passed in epigraphic units with markups attached.

__getMarkupUnits(): MarkupUnit[]__: Returns the list of passed in markup units as is.

# Discourse Renderer

Discourse units go hand in hand with epigraphic rendering. The `oare` package contains a `DiscourseRenderer` class that aids in rendering discourse units.

The constructor for this class requires an array of `DiscourseUnit`, which has the following properties:

| Property      | Type                                                                                                                                        | Required | Description                                                                                                                                        |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| type          | one of 'discourseUnit',<br>'sentence', 'phrase',<br>'number', 'word', 'paragraph',<br>'clause', 'heading', 'stitch',<br>'morpheme', or null | **Yes**  | The type of the discourse unit.<br>Units with type 'word' should<br>contain `spelling` or `transcription`<br>as well as `line` and `wordOnTablet`. |
| units         | DiscourseUnit[]                                                                                                                             | No       | A recursive list of the unit's<br>children.                                                                                                        |
| spelling      | string                                                                                                                                      | No       | The discourse unit's spelling.                                                                                                                     |
| transcription | string                                                                                                                                      | No       | The discourse unit's transcription.                                                                                                                |
| line          | number                                                                                                                                      | No       | The line number on the text the<br>discourse unit corresponds to.                                                                                  |
| wordOnTablet  | number                                                                                                                                      | No       | Which word on the text the discourse<br>unit corresponds to.                                                                                       |

### Properties

**lines: number[]** A list of the line numbers for this discourse reading.

### Methods

**lineReading(line: number): string** A reading of the discourse on the given line.

## Example

```js
import { DiscourseRenderer, DiscourseUnit } from 'oare';

const discourseUnits: DiscourseUnit[]  = [...]; // Units returned from API call
const renderer = new DiscourseRenderer(discourseUnits);

// Log the discourse reading for each line
renderer.lines.forEach(line => {
  console.log(renderer.lineReading(line));
});
```

# DiscourseHtmlRenderer

There is also a `DiscourseHtmlRenderer` which extends `DiscourseRenderer`. The only difference is the `lineReading` function will italicize transcriptions.

## Example

```js
import { DiscourseHtmlRenderer, DiscourseUnit } from 'oare';

const discourseUnits: DiscourseUnit[]  = [...]; // Units returned from API call
const renderer = new DiscourseHtmlRenderer(discourseUnits);

console.log(renderer.lineReading(1));

/* Logs transcriptions with <em> tags to italicize:

KIŠIB ku-ku-zi <em>mer'a</em> ṣé-eḫ-ri-ì-lí

*/
```