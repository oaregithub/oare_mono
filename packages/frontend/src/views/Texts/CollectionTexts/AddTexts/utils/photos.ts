import { AddTextInfo, TextPhoto, TextPhotoWithName } from '@oare/types';
import sl from '@/serviceLocator';

export const addNamesToTextPhotos = async (
  textInfo: AddTextInfo | undefined,
  photos: TextPhoto[]
): Promise<TextPhotoWithName[]> => {
  const photoNames = await Promise.all(
    photos.map(photo => generatePhotoName(textInfo, photo))
  );
  const photosWithNamesUncorrected: TextPhotoWithName[] = photos.map(
    (photo, idx) => ({
      ...photo,
      name: photoNames[idx],
    })
  );
  return correctPhotoNames(photosWithNamesUncorrected);
};

export const generatePhotoName = async (
  textInfo: AddTextInfo | undefined,
  photo: TextPhoto
): Promise<string> => {
  const store = sl.get('store');
  const server = sl.get('serverProxy');
  const { user } = store.getters;
  const lastNameAbb = user ? user.lastName.slice(0, 2).toLowerCase() : '';
  const firstNameAbb = user ? user.firstName.slice(0, 2).toLowerCase() : '';

  let collection: string = '';
  let objectNumber: string = '';
  if (textInfo && textInfo.excavationPrefix && textInfo.excavationNumber) {
    collection = textInfo.excavationPrefix;
    objectNumber = textInfo.excavationNumber;
  } else if (textInfo && textInfo.museumPrefix && textInfo.museumNumber) {
    collection = textInfo.museumPrefix;
    objectNumber = textInfo.museumNumber;
  } else if (
    textInfo &&
    textInfo.publicationPrefix &&
    textInfo.publicationNumber
  ) {
    collection = textInfo.publicationPrefix;
    objectNumber = textInfo.publicationNumber;
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

export const correctPhotoNames = (photos: TextPhotoWithName[]) => {
  const photosWithNames: TextPhotoWithName[] = photos.map((photo, idx) => {
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
