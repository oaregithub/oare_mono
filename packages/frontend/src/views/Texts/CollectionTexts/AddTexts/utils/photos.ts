import {
  ParseTreeProperty,
  TextPhoto,
  TextPhotoWithDetails,
  TaxonomyTree,
} from '@oare/types';
import sl from '@/serviceLocator';

export const addDetailsToTextPhotos = async (
  excavationPrefix: string | null,
  excavationNumber: string | null,
  museumPrefix: string | null,
  museumNumber: string | null,
  publicationPrefix: string | null,
  publicationNumber: string | null,
  photos: TextPhoto[]
): Promise<TextPhotoWithDetails[]> => {
  const server = sl.get('serverProxy');

  const photoNames = await Promise.all(
    photos.map(photo =>
      generatePhotoName(
        excavationPrefix,
        excavationNumber,
        museumPrefix,
        museumNumber,
        publicationPrefix,
        publicationNumber,
        photo
      )
    )
  );
  const taxonomyTree = await server.getTaxonomyTree();

  const photosWithNamesUncorrected: TextPhotoWithDetails[] = photos.map(
    (photo, idx) => {
      const sideValueUuids = getSideValueUuid(photo.side);
      const viewAngleValueUuid = getViewAngleValueUuid(photo.view);
      const valueUuids = [...sideValueUuids, viewAngleValueUuid];

      const properties: ParseTreeProperty[] = [];

      const searchTree = (
        node: TaxonomyTree,
        startingUuid: string
      ): TaxonomyTree | null => {
        if (node.valueUuid === startingUuid) {
          return node;
        }
        if (node.children !== null) {
          let result: TaxonomyTree | null = null;

          for (let i = 0; result === null && i < node.children.length; i += 1) {
            result = searchTree(node.children[i], startingUuid);
            if (result && node.children[i].valueUuid) {
              properties.unshift({ variable: node, value: node.children[i] });
            }
          }
          return result;
        }
        return null;
      };

      valueUuids.map(uuid => searchTree(taxonomyTree, uuid));

      const adjustedProperties: ParseTreeProperty[] = [];
      properties.forEach(prop => {
        const propUuidString = `${prop.variable.uuid}-${prop.value.uuid}`;
        if (
          !adjustedProperties
            .map(adjProp => `${adjProp.variable.uuid}-${adjProp.value.uuid}`)
            .includes(propUuidString)
        ) {
          adjustedProperties.push(prop);
        }
      });

      return {
        ...photo,
        name: photoNames[idx],
        properties: adjustedProperties,
      };
    }
  );
  return correctPhotoNames(photosWithNamesUncorrected);
};

const getSideValueUuid = (side: string | number | undefined): string[] => {
  switch (side) {
    case 1:
      return ['8f0bad4b-7887-11ec-bcc3-0282f921eac9'];
    case 2:
      return ['8f1ce20d-7887-11ec-bcc3-0282f921eac9'];
    case 3:
      return ['8f2bf270-7887-11ec-bcc3-0282f921eac9'];
    case 4:
      return ['8f3af02a-7887-11ec-bcc3-0282f921eac9'];
    case 5:
      return ['8f492346-7887-11ec-bcc3-0282f921eac9'];
    case 6:
      return ['8f57d3f1-7887-11ec-bcc3-0282f921eac9'];
    case 'a':
      return ['8f67224c-7887-11ec-bcc3-0282f921eac9'];
    case 'b':
      return ['8f768f01-7887-11ec-bcc3-0282f921eac9'];
    case 'c':
      return ['8f84f1db-7887-11ec-bcc3-0282f921eac9'];
    case 'd':
      return ['8f92e17c-7887-11ec-bcc3-0282f921eac9'];
    case 'e':
      return ['8fa0cb1d-7887-11ec-bcc3-0282f921eac9'];
    case 'f':
      return ['8faf16bd-7887-11ec-bcc3-0282f921eac9'];
    case 'x':
      return [
        '8f0bad4b-7887-11ec-bcc3-0282f921eac9',
        '8f1ce20d-7887-11ec-bcc3-0282f921eac9',
        '8f2bf270-7887-11ec-bcc3-0282f921eac9',
        '8f3af02a-7887-11ec-bcc3-0282f921eac9',
        '8f492346-7887-11ec-bcc3-0282f921eac9',
        '8f57d3f1-7887-11ec-bcc3-0282f921eac9',
      ];
    case 'h':
      return [
        '8f0bad4b-7887-11ec-bcc3-0282f921eac9',
        '8f1ce20d-7887-11ec-bcc3-0282f921eac9',
        '8f2bf270-7887-11ec-bcc3-0282f921eac9',
        '8f3af02a-7887-11ec-bcc3-0282f921eac9',
        '8f492346-7887-11ec-bcc3-0282f921eac9',
        '8f57d3f1-7887-11ec-bcc3-0282f921eac9',
        '661beb94-d53d-11ec-9ff3-0282f921eac9',
      ];
    case 8:
      return ['661c4328-d53d-11ec-9ff3-0282f921eac9'];
    case 9:
      return ['661c24aa-d53d-11ec-9ff3-0282f921eac9'];
    default:
      return [];
  }
};

const getViewAngleValueUuid = (view: string | undefined): string => {
  switch (view) {
    case 'u':
      return '8fbea91c-7887-11ec-bcc3-0282f921eac9';
    case 'd':
      return '8fce7051-7887-11ec-bcc3-0282f921eac9';
    case 'l':
      return '8fddfa11-7887-11ec-bcc3-0282f921eac9';
    case 'i':
      return '6615c8ec-d53d-11ec-9ff3-0282f921eac9';
    case 'h':
      return '661b39d8-d53d-11ec-9ff3-0282f921eac9';
    case 'j':
      return '661ba255-d53d-11ec-9ff3-0282f921eac9';
    case 'z':
      return '901e8362-7887-11ec-bcc3-0282f921eac9';
    case 'n':
      return '661be7da-d53d-11ec-9ff3-0282f921eac9';
    case 's':
      return '10d78a47-d53e-11ec-9ff3-0282f921eac9';
    case 'fr':
      return '9001b7a5-7887-11ec-bcc3-0282f921eac9';
    case 'fl':
      return '8ff31f12-7887-11ec-bcc3-0282f921eac9';
    case 'cx':
      return '902d78c7-7887-11ec-bcc3-0282f921eac9';
    case 'du':
      return '900fd50d-7887-11ec-bcc3-0282f921eac9';
    default:
      return '';
  }
};

export const generatePhotoName = async (
  excavationPrefix: string | null,
  excavationNumber: string | null,
  museumPrefix: string | null,
  museumNumber: string | null,
  publicationPrefix: string | null,
  publicationNumber: string | null,
  photo: TextPhoto
): Promise<string> => {
  const store = sl.get('store');
  const server = sl.get('serverProxy');
  const { user } = store.getters;
  const lastNameAbb = user ? user.lastName.slice(0, 2).toLowerCase() : '';
  const firstNameAbb = user ? user.firstName.slice(0, 2).toLowerCase() : '';

  let collection: string = '';
  let objectNumber: string = '';
  if (excavationPrefix && excavationNumber) {
    collection = excavationPrefix;
    objectNumber = excavationNumber;
  } else if (museumPrefix && museumNumber) {
    collection = museumPrefix;
    objectNumber = museumNumber;
  } else if (publicationPrefix && publicationNumber) {
    collection = publicationPrefix;
    objectNumber = publicationNumber;
  }

  collection = collection.toLowerCase();
  collection = collection.replace('kt', '');
  const piecesToRemove = collection.match(/[^a-z\d]/g) || [];
  piecesToRemove.forEach(piece => {
    collection = collection.replace(piece, '');
  });

  objectNumber = objectNumber.toLowerCase();
  const objectPiecesToRemove = objectNumber.match(/[^a-z\d]/g) || [];
  objectPiecesToRemove.forEach(piece => {
    objectNumber = objectNumber.replace(piece, '');
  });

  const preDesignatorText = `${collection}-${objectNumber}-${lastNameAbb}${firstNameAbb}-s-${photo.side}-${photo.view}-`;

  const designator = await server.getNextImageDesignator(preDesignatorText);

  const fileType = photo.upload
    ? photo.upload.type.slice(photo.upload.type.lastIndexOf('/') + 1)
    : '';

  return `${preDesignatorText}${designator}.${fileType}`;
};

export const correctPhotoNames = (photos: TextPhotoWithDetails[]) => {
  const photosWithNames: TextPhotoWithDetails[] = photos.map((photo, idx) => {
    const relevantPhotosNames = photos
      .slice(0, idx)
      .map(relevantPhoto => relevantPhoto.name);
    if (relevantPhotosNames.some(name => name === photo.name)) {
      const preDesignatorText = photo.name.slice(
        0,
        photo.name.lastIndexOf('-') + 1
      );
      const newDesignator =
        (Number(photo.name.slice(photo.name.lastIndexOf('-') + 1)) || 0) + 1;
      const name = `${preDesignatorText}${newDesignator}`;
      return {
        ...photo,
        name,
      };
    }
    return photo;
  });
  return photosWithNames;
};
