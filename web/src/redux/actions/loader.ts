export const LOADING = 'LOADING';
export const PAGE_LOADER = 'PAGE_LOADER';
export const SKELETON_LOADER = 'SKELETON_LOADER';

export interface LoaderAction {
  type: string;
  data: boolean;
  [key: string]: any;
}

export const Loading = (status: boolean): LoaderAction => ({
  type: LOADING,
  data: status,
});

export const PageLoader = (status: boolean): LoaderAction => ({
  type: PAGE_LOADER,
  data: status,
});

export const skeletonLoader = (status: boolean): LoaderAction => ({
  type: SKELETON_LOADER,
  data: status,
});
