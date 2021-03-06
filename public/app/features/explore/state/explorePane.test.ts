import { PayloadAction } from '@reduxjs/toolkit';
import { DataQuery, DefaultTimeZone, ExploreUrlState, LogsDedupStrategy, toUtc, EventBusExtended } from '@grafana/data';
import { ExploreId, ExploreItemState, ExploreUpdateState } from 'app/types';
import { thunkTester } from 'test/core/thunk/thunkTester';
import {
  changeDedupStrategyAction,
  initializeExploreAction,
  InitializeExplorePayload,
  paneReducer,
  refreshExplore,
} from './explorePane';
import { setQueriesAction } from './query';
import * as DatasourceSrv from 'app/features/plugins/datasource_srv';
import { makeExplorePaneState, makeInitialUpdateState } from './utils';
import { reducerTester } from '../../../../test/core/redux/reducerTester';

jest.mock('app/features/plugins/datasource_srv');
const getDatasourceSrvMock = (DatasourceSrv.getDatasourceSrv as any) as jest.Mock<DatasourceSrv.DatasourceSrv>;

beforeEach(() => {
  getDatasourceSrvMock.mockClear();
  getDatasourceSrvMock.mockImplementation(
    () =>
      ({
        getExternal: jest.fn().mockReturnValue([]),
        get: jest.fn().mockReturnValue({
          testDatasource: jest.fn(),
          init: jest.fn(),
        }),
      } as any)
  );
});

jest.mock('../../dashboard/services/TimeSrv', () => ({
  getTimeSrv: jest.fn().mockReturnValue({
    init: jest.fn(),
  }),
}));

const t = toUtc();
const testRange = {
  from: t,
  to: t,
  raw: {
    from: t,
    to: t,
  },
};

const setup = (updateOverides?: Partial<ExploreUpdateState>) => {
  const exploreId = ExploreId.left;
  const containerWidth = 1920;
  const eventBridge = {} as EventBusExtended;
  const timeZone = DefaultTimeZone;
  const range = testRange;
  const urlState: ExploreUrlState = {
    datasource: 'some-datasource',
    queries: [],
    range: range.raw,
  };
  const updateDefaults = makeInitialUpdateState();
  const update = { ...updateDefaults, ...updateOverides };
  const initialState = {
    user: {
      orgId: '1',
      timeZone,
    },
    explore: {
      [exploreId]: {
        initialized: true,
        urlState,
        containerWidth,
        eventBridge,
        update,
        datasourceInstance: { name: 'some-datasource' },
        queries: [] as DataQuery[],
        range,
        refreshInterval: {
          label: 'Off',
          value: 0,
        },
      },
    },
  };

  return {
    initialState,
    exploreId,
    range,
    containerWidth,
    eventBridge,
  };
};

describe('refreshExplore', () => {
  describe('when explore is initialized', () => {
    describe('and update datasource is set', () => {
      it('then it should dispatch initializeExplore', async () => {
        const { exploreId, initialState, containerWidth, eventBridge } = setup({ datasource: true });

        const dispatchedActions = await thunkTester(initialState)
          .givenThunk(refreshExplore)
          .whenThunkIsDispatched(exploreId);

        const initializeExplore = dispatchedActions[1] as PayloadAction<InitializeExplorePayload>;
        const { type, payload } = initializeExplore;

        expect(type).toEqual(initializeExploreAction.type);
        expect(payload.containerWidth).toEqual(containerWidth);
        expect(payload.eventBridge).toEqual(eventBridge);
        expect(payload.queries.length).toBe(1); // Queries have generated keys hard to expect on
        expect(payload.range.from).toEqual(testRange.from);
        expect(payload.range.to).toEqual(testRange.to);
        expect(payload.range.raw.from).toEqual(testRange.raw.from);
        expect(payload.range.raw.to).toEqual(testRange.raw.to);
      });
    });

    describe('and update queries is set', () => {
      it('then it should dispatch setQueriesAction', async () => {
        const { exploreId, initialState } = setup({ queries: true });

        const dispatchedActions = await thunkTester(initialState)
          .givenThunk(refreshExplore)
          .whenThunkIsDispatched(exploreId);

        expect(dispatchedActions[0].type).toEqual(setQueriesAction.type);
        expect(dispatchedActions[0].payload).toEqual({ exploreId, queries: [] });
      });
    });
  });

  describe('when update is not initialized', () => {
    it('then it should not dispatch any actions', async () => {
      const exploreId = ExploreId.left;
      const initialState = { explore: { [exploreId]: { initialized: false } } };

      const dispatchedActions = await thunkTester(initialState)
        .givenThunk(refreshExplore)
        .whenThunkIsDispatched(exploreId);

      expect(dispatchedActions).toEqual([]);
    });
  });
});

describe('Explore item reducer', () => {
  describe('changing dedup strategy', () => {
    describe('when changeDedupStrategyAction is dispatched', () => {
      it('then it should set correct dedup strategy in state', () => {
        const initialState = makeExplorePaneState();

        reducerTester<ExploreItemState>()
          .givenReducer(paneReducer, initialState)
          .whenActionIsDispatched(
            changeDedupStrategyAction({ exploreId: ExploreId.left, dedupStrategy: LogsDedupStrategy.exact })
          )
          .thenStateShouldEqual({
            ...makeExplorePaneState(),
            dedupStrategy: LogsDedupStrategy.exact,
          });
      });
    });
  });
});
