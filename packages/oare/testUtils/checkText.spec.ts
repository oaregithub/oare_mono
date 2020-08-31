/**
 * @jest-environment node
 */
import { createRenderer } from './index';

test('markup brackets do not carry across multiple lines', async () => {
  const renderer = await createRenderer('5ed72137-a7dc-3c32-0f8d-f0795c8fff4f');
  expect(renderer.lineReading(7)).toBe('⸢a⸣-na [ku-ṣí-a]');
  expect(renderer.lineReading(8)).toBe('[a-na be-a-lim i-dí-in]');
});

test('renders with small brackets', async () => {
  const renderer = await createRenderer('7dd917ff-ed6a-7ddf-3a92-b277cb723eb8');
  expect(renderer.lineReading(4)).toBe('qá-du-um ‹ša› iš-tí-šu!-ma');
});

test('unit with damage in middle renders next unit with damage', async () => {
  const renderer = await createRenderer('5ed72137-a7dc-3c32-0f8d-f0795c8fff4f');
  expect(renderer.lineReading(3)).toBe('⸢KIŠ⸣IB ⸢ku⸣-ṣí-a DUMU');
});

test('does not render empty brackets', async () => {
  const renderer = await createRenderer('37ea781c-687b-4e96-b8a5-c100ddc27f30');
  expect(renderer.lineReading(22)).toBe('[q]á-bi-a-tí | né-nu a-na-kam');
});

test('does not mismatch brackets', async () => {
  const renderer = await createRenderer('37ea781c-687b-4e96-b8a5-c100ddc27f30');
  expect(renderer.lineReading(26)).toBe('[i]š-tù [xxxxxxxxxx] ⸢a-bu⸣-š[a-l]im');
});
