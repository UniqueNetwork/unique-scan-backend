import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

export const CURRENT_TRACKING_EXTRINSICS_METRIC = 'current_tracking_extrinsics';

export const CurrentTrackingExtrinsicsMetric = makeGaugeProvider({
  name: CURRENT_TRACKING_EXTRINSICS_METRIC,
  help: 'Count of current tracking extrinsics',
});
