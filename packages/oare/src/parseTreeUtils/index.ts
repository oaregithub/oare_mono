import { ItemPropertyRow, AppliedProperty } from '@oare/types';
import { v4 } from 'uuid';

// FIXME maybe rename to imply that they are ItemPropertyRows?
export const convertAppliedPropsToItemProps = (
  properties: AppliedProperty[],
  referenceUuid: string
): ItemPropertyRow[] => {
  const propertiesWithUuids = properties.map(prop => ({
    ...prop,
    uuid: v4(),
  }));
  const propertiesWithParentUuid = propertiesWithUuids.map(prop => {
    const possibleParents = propertiesWithUuids.filter(
      baseProp =>
        baseProp.valueRow &&
        baseProp.valueRow.hierarchy.uuid ===
          prop.variableRow.hierarchy.parentUuid
    );
    if (possibleParents.length === 1) {
      return {
        ...prop,
        parentUuid: possibleParents[0].uuid,
      };
    }
    return {
      ...prop,
      parentUuid: null,
    };
  });
  const itemPropertyRows: ItemPropertyRow[] = propertiesWithParentUuid.map(
    prop => ({
      uuid: prop.uuid,
      referenceUuid,
      parentUuid: prop.parentUuid,
      level: prop.variableRow.level,
      variableUuid: prop.variableRow.uuid,
      valueUuid: prop.valueRow ? prop.valueRow.uuid : null,
      objectUuid: prop.objectUuid,
      value: prop.value?.toString() || null,
    })
  );
  return itemPropertyRows;
};
