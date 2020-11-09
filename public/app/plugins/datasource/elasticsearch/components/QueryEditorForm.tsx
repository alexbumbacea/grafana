import React, { FunctionComponent, memo } from 'react';
import { InlineField, InlineFieldRow, Input, QueryField } from '@grafana/ui';
import { MetricAggregationsEditor } from './MetricAggregationsEditor';
import { ElasticsearchQuery } from '../types';
import { BucketAggregationsEditor } from './BucketAggregationsEditor';
import { useDispatch } from '../hooks/useStatelessReducer';
import { changeAliasPattern, changeQuery } from './state';

interface Props {
  value: ElasticsearchQuery;
}

export const QueryEditorForm: FunctionComponent<Props> = memo(({ value }) => {
  const dispatch = useDispatch();

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query" labelWidth={15} grow>
          <QueryField
            query={value.query}
            onChange={query => dispatch(changeQuery(query))}
            // TODO: onRunQuery={onRunQuery}
            placeholder="Lucene Query"
            portalOrigin="elasticsearch"
          />
        </InlineField>
        <InlineField label="Alias" labelWidth={15}>
          <Input placeholder="Alias Pattern" onBlur={e => dispatch(changeAliasPattern(e.currentTarget.value))} />
        </InlineField>
      </InlineFieldRow>

      <MetricAggregationsEditor value={value.metrics || []} />
      <BucketAggregationsEditor value={value.bucketAggs || []} />
    </>
  );
});
