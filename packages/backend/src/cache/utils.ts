import { Request } from 'express';
import axios from 'axios';
import { API_PATH } from '@/setupRoutes';
import { ClearCacheOptions } from '.';

export const crossRegionCacheClear = async (
  url: string,
  options: ClearCacheOptions,
  req: Request
) => {
  if (process.env.NODE_ENV === 'production' && req.headers.authorization) {
    const oppositeRegionSubDomain = getOppositeRegionSubDomain();

    if (oppositeRegionSubDomain) {
      await axios.delete(
        `https://${oppositeRegionSubDomain}.${process.env.BASE_HOST}${API_PATH}/cache/clear`,
        {
          params: {
            url,
            level: options.level,
            propogate: 'false',
          },
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    }
  }
};

export const crossRegionCacheFlush = async (req: Request) => {
  if (process.env.NODE_ENV === 'production' && req.headers.authorization) {
    const oppositeRegionSubDomain = getOppositeRegionSubDomain();

    if (oppositeRegionSubDomain) {
      await axios.delete(
        `https://${oppositeRegionSubDomain}.${process.env.BASE_HOST}${API_PATH}/cache/flush`,
        {
          params: {
            propogate: 'false',
          },
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    }
  }
};

export const crossRegionCacheKeys = async (
  url: string,
  level: 'exact' | 'startsWith',
  req: Request
): Promise<number> => {
  let numCrossOriginCacheKeys = 0;
  if (process.env.NODE_ENV === 'production' && req.headers.authorization) {
    const oppositeRegionSubDomain = getOppositeRegionSubDomain();

    if (oppositeRegionSubDomain) {
      const { data } = await axios.get(
        `https://${oppositeRegionSubDomain}.${process.env.BASE_HOST}${API_PATH}/cache/keys`,
        {
          params: {
            url,
            level,
            propogate: 'false',
          },
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
      numCrossOriginCacheKeys = data;
    }
  }

  return numCrossOriginCacheKeys;
};

const getOppositeRegionSubDomain = (): string | null => {
  switch (process.env.CURRENT_EB_REGION) {
    case 'us-west-2':
      return 'paris';
    case 'eu-west-3':
      return 'oregon';
    default:
      return null;
  }
};
