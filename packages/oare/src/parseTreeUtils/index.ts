import { InsertItemPropertyRow, AppliedProperty } from '@oare/types';
import { v4 } from 'uuid';

export const convertAppliedPropsToItemProps = (
  properties: AppliedProperty[],
  referenceUuid: string
): InsertItemPropertyRow[] => {
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
  const itemPropertyRows: InsertItemPropertyRow[] = propertiesWithParentUuid.map(
    prop => ({
      uuid: prop.uuid,
      referenceUuid,
      parentUuid: prop.parentUuid,
      level: prop.variableRow.level,
      variableUuid: prop.variableRow.uuid,
      valueUuid: prop.valueRow ? prop.valueRow.uuid : null,
      objectUuid: prop.objectUuid,
      value: prop.value,
    })
  );
  return itemPropertyRows;
};
