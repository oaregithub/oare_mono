import {
  ParseTreeProperty,
  ParseTreePropertyRow,
  InsertItemPropertyRow,
} from '@oare/types';
import { v4 } from 'uuid';

export const convertParsePropsToItemProps = (
  properties: ParseTreeProperty[],
  referenceUuid: string
): InsertItemPropertyRow[] => {
  const propertiesWithUuids = properties.map(prop => ({
    ...prop,
    uuid: v4(),
  }));
  const propertiesWithParentUuid: ParseTreePropertyRow[] = propertiesWithUuids.map(
    prop => {
      const parentUuid = propertiesWithUuids
        .filter(baseProp => baseProp.value.uuid === prop.variable.parentUuid)
        .map(baseProp => baseProp.uuid)[0];
      return {
        ...prop,
        parentUuid,
      };
    }
  );

  const itemPropertyRows: InsertItemPropertyRow[] = propertiesWithParentUuid.map(
    prop => ({
      uuid: prop.uuid,
      referenceUuid,
      parentUuid: prop.parentUuid,
      level: prop.variable.level,
      variableUuid: prop.variable.variableUuid,
      valueUuid: prop.value.valueUuid,
      objectUuid: null,
      value: null,
    })
  );

  return itemPropertyRows;
};
