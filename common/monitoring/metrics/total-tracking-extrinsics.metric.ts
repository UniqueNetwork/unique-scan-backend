import { makeCounterProvider } from '@willsoto/nestjs-prometheus';

export const TOTAL_TRACKING_EXTRINSICS_METRIC = 'total_tracking_extrinsics';

export const TotalTrackingExtrinsicsMetric = makeCounterProvider({
  name: TOTAL_TRACKING_EXTRINSICS_METRIC,
  help: 'Count of total tracking extrinsics',
});
