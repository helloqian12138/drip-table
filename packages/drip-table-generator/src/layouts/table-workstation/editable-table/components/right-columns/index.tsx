/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */
import './index.less';

import classNames from 'classnames';
import { DripTableExtraOptions, DripTableRecordTypeBase, DripTableRecordTypeWithSubtable, ExtractDripTableExtraOption } from 'drip-table';
import React from 'react';

import { DTGTableConfig } from '@/context/table-configs';
import { DripTableGeneratorProps } from '@/typing';

import ColumnHeader from '../column-header';
import { LeftFixedColumnsHandler } from '../left-columns';
import { ScrollableColumnsHandler } from '../scroll-columns';
import TableSection from '../table-section';

export interface RightFixedColumnsProps<
  RecordType extends DripTableRecordTypeWithSubtable<DripTableRecordTypeBase, ExtractDripTableExtraOption<ExtraOptions, 'SubtableDataSourceKey'>>,
  ExtraOptions extends Partial<DripTableExtraOptions> = never
> extends DripTableGeneratorProps<RecordType, ExtraOptions> {
  tableConfig: DTGTableConfig;
  previewDataSource: ({ id: number; record: RecordType })[];
  containerWidth: number;
  siblings: [React.RefObject<LeftFixedColumnsHandler>, React.RefObject<ScrollableColumnsHandler>];
  columnList: { id: number; column: DTGTableConfig['columns'][number] }[];
  ref?: React.RefObject<RightFixedColumnsHandler>;
  subTableHeights?: number[];
  rowHeaderHeights?: number[];
}

export interface RightFixedColumnsHandler {
  getRowHeight: () => number;
}

function RightFixedColumnsInner<
  RecordType extends DripTableRecordTypeWithSubtable<DripTableRecordTypeBase, ExtractDripTableExtraOption<ExtraOptions, 'SubtableDataSourceKey'>>,
  ExtraOptions extends Partial<DripTableExtraOptions> = never
>(
  props: RightFixedColumnsProps<RecordType, ExtraOptions>,
  ref: React.ForwardedRef<RightFixedColumnsHandler>,
) {
  const rowRef = React.createRef<HTMLDivElement>();
  const [rowHeight, setRowHeight] = React.useState(void 0 as number | undefined);

  const getCurrentRowHeight = () => {
    let maxCellHeight = 0;
    const currentRowHeight = rowRef.current?.offsetHeight ?? 0;
    for (const element of (rowRef.current?.children || []) as HTMLDivElement[]) {
      if (element.children[0]) {
        const trueCellHeight = (element.children[0] as HTMLDivElement).offsetHeight + 28;
        if (trueCellHeight > maxCellHeight) {
          maxCellHeight = trueCellHeight;
        }
      }
    }
    return currentRowHeight - maxCellHeight === 1 ? currentRowHeight : maxCellHeight;
  };

  React.useEffect(() => {
    const currentRowHeight = getCurrentRowHeight();
    const [leftRef, scrollRef] = props.siblings;
    const leftFixedColumnsHeight = leftRef.current?.getRowHeight() || 0;
    const scrollColumnsHeight = scrollRef.current?.getRowHeight() || 0;
    const maxSiblingsHeight = Math.max(scrollColumnsHeight, leftFixedColumnsHeight);
    if (maxSiblingsHeight > currentRowHeight) {
      setRowHeight(maxSiblingsHeight);
    }
  }, [props.columnList, props.tableConfig, props.dataSource]);

  React.useImperativeHandle(ref, () => ({
    getRowHeight: getCurrentRowHeight,
  }));
  return (
    <div
      className={classNames('jfe-drip-table-generator-workstation-table-fixed-column right', {
        bordered: props.columnList.length > 0 || props.tableConfig.hasSubTable || props.tableConfig.configs.rowSelection,
      })}
    >
      <div className={classNames(
        'jfe-drip-table-generator-workstation-table-row jfe-drip-table-generator-workstation-table-header',
        {
          sticky: props.tableConfig.configs.sticky,
          invisible: props.tableConfig.configs.showHeader === false,
        },
      )}
      >
        {props.columnList.map(columnWrapper => (
          <ColumnHeader
            tableConfig={props.tableConfig}
            column={columnWrapper.column}
            columnId={columnWrapper.id}
            customColumnAddPanel={props.customColumnAddPanel}
            customComponentPanel={props.customComponentPanel}
            columnTools={props.columnTools}
            dataSource={props.previewDataSource}
            onClick={props.onClick}
            renderHeaderCellFilter={props.renderHeaderCellFilter}
            containerWidth={props.containerWidth}
          />
        ))}
      </div>
      {props.previewDataSource.map((record, rowIndex) => (
        <React.Fragment>
          {props.tableConfig.configs.rowHeader && (
            <div style={{ width: '100%', height: props.rowHeaderHeights?.[rowIndex] || 0 }} />
          )}
          <div
            className={classNames('jfe-drip-table-generator-workstation-table-row', {
              stripe: props.tableConfig.configs.stripe && rowIndex % 2 === 1,
            })}
            ref={rowRef}
            style={{ height: rowHeight }}
          >
            <TableSection
              {...props}
              record={record}
              rowIndex={rowIndex}
              columnList={props.columnList}
              tableConfig={props.tableConfig}
              containerWidth={props.containerWidth}
              isLastRow={rowIndex === props.previewDataSource.length - 1}
            />
          </div>
          {(props.subTableHeights?.length || 0) > 0 && (props.subTableHeights?.[rowIndex] || 0) > 0 && (
            <div style={{ padding: '32px 0 12px 0', width: '100%', height: props.subTableHeights?.[rowIndex] || 0 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// 使用 forwardRef 包装
const RightFixedColumns = React.forwardRef(RightFixedColumnsInner) as <RecordType extends DripTableRecordTypeWithSubtable<DripTableRecordTypeBase, ExtractDripTableExtraOption<ExtraOptions, 'SubtableDataSourceKey'>>,
  ExtraOptions extends Partial<DripTableExtraOptions> = never>(props: RightFixedColumnsProps<RecordType, ExtraOptions>, ref: React.ForwardedRef<RightFixedColumnsHandler>) => JSX.Element;

export default RightFixedColumns;
