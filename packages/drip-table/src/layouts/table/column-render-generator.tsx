/*
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2021 JD Network Technology Co., Ltd.
 */

import type { ColumnType as TableColumnType } from 'rc-table/lib/interface';
import React from 'react';

import {
  type DripTableExtraOptions,
  type DripTableProps,
  type DripTableRecordTypeBase,
  type DripTableRecordTypeWithSubtable,
  type ExtractDripTableExtraOption,
  type SchemaObject,
} from '@/types';
import { indexValue, setValue } from '@/utils/operator';
import { type SandboxFunctionPreprocess } from '@/utils/sandbox';
import DripTableBuiltInComponents, { type DripTableBuiltInColumnSchema, type DripTableComponentProps } from '@/components/cell-components';

import { type DripTableColumnRenderOptions } from './types';

export interface RcTableRecordType<
  RecordType extends DripTableRecordTypeWithSubtable<DripTableRecordTypeBase, ExtractDripTableExtraOption<ExtraOptions, 'SubtableDataSourceKey'>>,
  ExtraOptions extends Partial<DripTableExtraOptions> = never,
> {
  type: 'header' | 'body' | 'footer';
  key: string;
  index: number;
  record: RecordType;
}

function hookSchemaEventRaiser<T>(schema: T, schemaFunctionPreprocessor: SandboxFunctionPreprocess, props: Record<string, unknown>): T {
  if (Array.isArray(schema)) {
    return schema.map(v => schemaFunctionPreprocessor(v, props)) as T;
  }
  if (schema && typeof schema === 'object') {
    return Object.fromEntries(
      Object.entries(schema)
        .map(([k, v]) => [k, typeof v === 'function' ? schemaFunctionPreprocessor(v, props) : hookSchemaEventRaiser(v, schemaFunctionPreprocessor, props)]),
    ) as T;
  }
  return schema;
}

/**
 * 根据列 Schema，生成表格单元格渲染函数
 * @param tableInfo 表格信息
 * @param columnSchema 表格列 Schema
 * @param extraProps 一些额外的参数
 * @returns 表格单元格渲染函数
 */
export const columnRenderGenerator = <
  RecordType extends DripTableRecordTypeWithSubtable<DripTableRecordTypeBase, ExtractDripTableExtraOption<ExtraOptions, 'SubtableDataSourceKey'>>,
  ExtraOptions extends Partial<DripTableExtraOptions> = never,
>(
    tableInfo: DripTableColumnRenderOptions<RecordType, ExtraOptions>['tableInfo'],
    columnSchema: DripTableBuiltInColumnSchema<ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>> | ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>,
    extraProps: DripTableColumnRenderOptions<RecordType, ExtraOptions>['extraProps'],
  ): NonNullable<TableColumnType<RcTableRecordType<RecordType>>['render']> => {
  if ('component' in (columnSchema as DripTableBuiltInColumnSchema)) {
    const BuiltInComponent = extraProps.defaultComponentLib
      ? null
      : DripTableBuiltInComponents[columnSchema.component] as
      React.JSXElementConstructor<DripTableComponentProps<RecordType, DripTableBuiltInColumnSchema<ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>>>> & { schema?: SchemaObject };
    const onChange = (record: RecordType, index: number, value: unknown) => {
      const ds = [...tableInfo.dataSource];
      const rec = { ...record };
      setValue(rec, columnSchema.dataIndex, value);
      ds[index] = rec;
      extraProps.onDataSourceChange?.(ds, tableInfo);
    };
    type PropsTranslator = (rawValue: unknown, context: { value: unknown; record: RecordType; recordIndex: number; ext: typeof extraProps.ext }) => unknown;
    const generatePropsTranslator = (translatorSchema: unknown): PropsTranslator => {
      if (translatorSchema === void 0) {
        return (v, c) => v;
      }
      if (typeof translatorSchema === 'string') {
        try {
          const translate = extraProps.createEvaluator(translatorSchema, ['props']);
          return (v, c) => {
            try {
              return translate?.(c);
            } catch {}
            return void 0;
          };
        } catch {}
      }
      return () => translatorSchema;
    };
    const dataTranslator = generatePropsTranslator(columnSchema.dataTranslation);
    const hiddenTranslator = generatePropsTranslator(columnSchema.hidden);
    const disableTranslator = generatePropsTranslator(columnSchema.disable);
    const editableTranslator = generatePropsTranslator(columnSchema.editable);
    if (BuiltInComponent) {
      return function BuiltInComponentIns(_, row) {
        const rawValue = indexValue(row.record, columnSchema.dataIndex, columnSchema.defaultValue);
        const record = row.record;
        const recordIndex = row.index;
        const ext = extraProps.ext;
        const value = dataTranslator(rawValue, { value: rawValue, record, recordIndex, ext });
        const translatorContext = { value, record, recordIndex, ext };
        if (hiddenTranslator(false, translatorContext)) {
          return null;
        }
        const finalColumnSchema = extraProps.schemaFunctionPreprocessor
          ? hookSchemaEventRaiser(columnSchema, extraProps.schemaFunctionPreprocessor, { value, record, recordIndex, ext })
          : columnSchema;
        return (
          <BuiltInComponent
            data={record}
            record={record}
            recordIndex={recordIndex}
            value={value}
            indexValue={(dataIndex, defaultValue) => {
              const v = indexValue(row.record, dataIndex, defaultValue ?? columnSchema.defaultValue);
              return dataTranslator(v, { value: v, record, recordIndex, ext });
            }}
            renderSchema={(sc, r, ri): React.ReactNode => {
              const render = columnRenderGenerator(tableInfo, sc as unknown as DripTableBuiltInColumnSchema<ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>> | ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>, extraProps);
              return render(null, { type: 'body', key: sc.key, index: ri, record: r }, 0);
            }}
            createEvaluator={extraProps.createEvaluator}
            evaluate={extraProps.evaluate}
            safeEvaluate={extraProps.safeEvaluate}
            finalizeString={extraProps.finalizeString}
            preview={extraProps.preview as DripTableComponentProps<RecordType, DripTableBuiltInColumnSchema<ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>>>['preview']}
            disable={Boolean(disableTranslator(false, translatorContext))}
            editable={Boolean(editableTranslator(tableInfo.schema.editable, translatorContext))}
            onChange={v => onChange(record, recordIndex, v)}
            schema={finalColumnSchema as unknown as DripTableBuiltInColumnSchema<ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>>}
            ext={extraProps.ext}
            components={extraProps.components as DripTableProps<DripTableRecordTypeWithSubtable<DripTableRecordTypeBase, NonNullable<React.Key>>, DripTableExtraOptions>['components']}
            icons={extraProps.icons}
            fireEvent={event => extraProps.onEvent?.({ record, recordIndex, ...event }, tableInfo)}
          />
        );
      };
    }
    let [libName, componentName] = columnSchema.component.split('::');
    if (!componentName && extraProps.defaultComponentLib) {
      componentName = libName;
      libName = extraProps.defaultComponentLib;
    }
    if (libName && componentName) {
      const ExtraComponent = extraProps.components?.[libName]?.[componentName];
      if (ExtraComponent) {
        return function ExtraComponentIns(_, row) {
          const rawValue = indexValue(row.record, columnSchema.dataIndex, columnSchema.defaultValue);
          const record = row.record;
          const recordIndex = row.index;
          const ext = extraProps.ext;
          const value = dataTranslator(rawValue, { value: rawValue, record, recordIndex, ext });
          const translatorContext = { value, record, recordIndex, ext };
          if (hiddenTranslator(false, translatorContext)) {
            return null;
          }
          const finalColumnSchema = extraProps.schemaFunctionPreprocessor
            ? hookSchemaEventRaiser(columnSchema, extraProps.schemaFunctionPreprocessor, { value, record, recordIndex, ext })
            : columnSchema;
          return (
            <ExtraComponent
              data={record}
              record={record}
              recordIndex={recordIndex}
              value={value}
              indexValue={(dataIndex, defaultValue) => {
                const v = indexValue(row.record, dataIndex, defaultValue ?? columnSchema.defaultValue);
                return dataTranslator(v, { value: v, record, recordIndex, ext });
              }}
              renderSchema={(sc, r, ri): React.ReactNode => {
                const render = columnRenderGenerator(tableInfo, sc as unknown as DripTableBuiltInColumnSchema<ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>> | ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>, extraProps);
                return render(null, { type: 'body', key: sc.key, index: ri, record: r }, 0);
              }}
              createEvaluator={extraProps.createEvaluator}
              evaluate={extraProps.evaluate}
              safeEvaluate={extraProps.safeEvaluate}
              finalizeString={extraProps.finalizeString}
              preview={extraProps.preview}
              disable={Boolean(disableTranslator(false, translatorContext))}
              editable={Boolean(editableTranslator(tableInfo.schema.editable, translatorContext))}
              onChange={v => onChange(record, recordIndex, v)}
              schema={finalColumnSchema as ExtractDripTableExtraOption<ExtraOptions, 'CustomColumnSchema'>}
              ext={extraProps.ext}
              components={extraProps.components as DripTableProps<DripTableRecordTypeWithSubtable<DripTableRecordTypeBase, NonNullable<React.Key>>, DripTableExtraOptions>['components']}
              icons={extraProps.icons}
              fireEvent={event => extraProps.onEvent?.({ record, recordIndex, ...event }, tableInfo)}
            />
          );
        };
      }
    }
  }
  return function UnknownComponentIns() {
    return extraProps.unknownComponent ?? <div className="ajv-error">{ `Unknown column component: ${columnSchema.component}` }</div>;
  };
};
