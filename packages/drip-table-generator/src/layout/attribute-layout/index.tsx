/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

import { ExclamationCircleTwoTone } from '@ant-design/icons';
import { Alert, Button, Result, Tabs, Tooltip } from 'antd';
import { DripTableDriver, DripTableRecordTypeBase, DripTableSchema } from 'drip-table';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';

import { filterAttributes } from '@/utils';
import { DripTableColumn, globalActions, GlobalStore } from '@/store';
import CustomForm from '@/components/CustomForm';
import { useGlobalData } from '@/hooks';
import components from '@/table-components';
import { DripTableComponentAttrConfig, DTGComponentPropertySchema } from '@/typing';

import { GlobalAttrFormConfigs } from '../configs';
import { CollapseIcon, TabsIcon } from './icons';

import styles from './index.module.less';

type GlobalSchema = Omit<DripTableSchema<DripTableColumn<string, never>>, '$schema' | 'columns'>;

interface Props {
  customComponentPanel: {
    mode: 'add' | 'replace';
    components: DripTableComponentAttrConfig[];
  } | undefined;
  customGlobalConfigPanel: DTGComponentPropertySchema[] | undefined;
  driver: DripTableDriver<DripTableRecordTypeBase>;
}

const { TabPane } = Tabs;

const AttributeLayout = (props: Props & { store: GlobalStore }) => {
  const { dataFields, mockDataSource: isDemo } = useGlobalData();

  const [state, setState] = props.store;
  const store = { state, setState };

  const [activeKey, setActiveKey] = React.useState('0');

  const [formDisplayMode, setFormDisplayMode] = React.useState('tabs' as 'collapse' | 'tabs');

  const [codeErrorMessage, setCodeErrorMessage] = React.useState('');

  const [code, setCode] = React.useState(JSON.stringify(state.previewDataSource, null, 4));

  const getActiveKey = () => {
    if (activeKey === '0') {
      return state.currentColumn ? '1' : '2';
    }
    return activeKey;
  };

  const getComponents = () => {
    let componentsToUse = components;
    if (props.customComponentPanel) {
      const customComponents = props.customComponentPanel.components;
      componentsToUse = props.customComponentPanel.mode === 'add' ? [...components, ...customComponents] : [...customComponents];
    }
    return [...componentsToUse];
  };

  const encodeGlobalConfigs = (formData: { [key: string]: unknown }): GlobalSchema => ({
    bordered: formData.bordered as boolean,
    size: formData.size as 'small' | 'middle' | 'large' | undefined,
    ellipsis: formData.ellipsis as boolean,
    header: false,
    pagination: formData.pagination
      ? {
        pageSize: formData['pagination.pageSize'] as number,
        position: formData['pagination.position'] as 'bottomLeft' | 'bottomCenter' | 'bottomRight',
      }
      : false,
  });

  const encodeColumnConfigs = (formData: { [key: string]: unknown }) => {
    const uiProps = {};
    const dataProps = {};
    Object.keys(formData).forEach((key) => {
      if (key.startsWith('ui:props.')) {
        uiProps[key.replace('ui:props.', '')] = formData[key];
      } else {
        dataProps[key] = formData[key];
      }
    });
    const columnConfig = getComponents().find(item => item['ui:type'] === state.currentColumn?.['ui:type']);
    return {
      ...filterAttributes(dataProps, ['ui:props', 'ui:type', 'type', 'name', 'dataIndex', 'title', 'width', 'group']),
      dataIndex: formData.dataIndex as string | string[],
      title: formData.title as string,
      width: formData.width as string,
      'ui:type': state.currentColumn?.['ui:type'],
      'ui:props': { ...uiProps },
      type: columnConfig ? columnConfig.type : state.currentColumn?.type,
    } as DripTableColumn<string, never>;
  };

  const submitTableData = (codeValue?: string) => {
    setCodeErrorMessage('');
    setCode(codeValue || '');
    try {
      state.previewDataSource = JSON.parse(codeValue || '');
      setState({ ...state });
      globalActions.updatePreviewDataSource(store);
    } catch (error) {
      setCodeErrorMessage((error as Error).message);
    }
  };

  const renderGlobalForm = () => (
    <CustomForm<GlobalSchema>
      configs={props.customGlobalConfigPanel || GlobalAttrFormConfigs}
      data={state.globalConfigs}
      encodeData={encodeGlobalConfigs}
      groupType={formDisplayMode}
      theme={props.driver}
      onChange={(data) => {
        state.globalConfigs = { ...data };
        globalActions.updateGlobalConfig(store);
      }}
    />
  );

  const renderColumnForm = () => {
    if (!state.currentColumn) {
      return (
        <Result
          icon={<ExclamationCircleTwoTone />}
          title={<div style={{ color: '#999' }}>请点击选择要编辑的列</div>}
        />
      );
    }
    const columnConfig = getComponents().find(schema => schema['ui:type'] === state.currentColumn?.['ui:type']);
    columnConfig?.attrSchema.forEach((schema) => {
      const uiProps = schema['ui:props'];
      if (!uiProps) {
        return;
      }
      if (uiProps.optionsParam === '$$FIELD_KEY_OPTIONS$$') {
        uiProps.options = isDemo
          ? Object.keys(state.previewDataSource[0] || {}).map(key => ({ label: key, value: key }))
          : dataFields?.map(key => ({ label: key, value: key })) || [];
      }
      if (uiProps.items) {
        (uiProps.items as DTGComponentPropertySchema[])?.forEach((item, index) => {
          const itemUiProps = item['ui:props'];
          if (!itemUiProps) {
            return;
          }
          if (itemUiProps.optionsParam === '$$FIELD_KEY_OPTIONS$$') {
            itemUiProps.options = isDemo
              ? Object.keys(state.previewDataSource[0] || {}).map(key => ({ label: key, value: key }))
              : dataFields?.map(key => ({ label: key, value: key })) || [];
          }
        });
      }
    });
    return (
      <CustomForm<DripTableColumn<string, never>>
        primaryKey="key"
        configs={columnConfig ? columnConfig.attrSchema || [] : []}
        data={state.currentColumn}
        encodeData={encodeColumnConfigs}
        extendKeys={['ui:props']}
        groupType={formDisplayMode}
        theme={props.driver}
        onChange={(data) => {
          state.currentColumn = Object.assign(state.currentColumn, data);
          const idx = state.columns.findIndex(item => item.key === state.currentColumn?.key);
          if (idx > -1 && state.currentColumn) {
            state.columns[idx] = state.currentColumn;
          }
          globalActions.editColumns(store);
          globalActions.checkColumn(store);
        }}
      />
    );
  };

  return (
    <div className={styles['attributes-wrapper']}>
      <div className={styles['attributes-container']}>
        <Tabs
          activeKey={getActiveKey()}
          type="card"
          onChange={(key) => { setActiveKey(key); }}
          tabBarExtraContent={activeKey !== '3'
            ? (
              <Tooltip title={formDisplayMode === 'tabs' ? '折叠面板' : '标签面板'}>
                <Button
                  style={{ borderRadius: 2 }}
                  size="small"
                  onClick={() => { setFormDisplayMode(formDisplayMode === 'collapse' ? 'tabs' : 'collapse'); }}
                  icon={formDisplayMode === 'tabs' ? <CollapseIcon style={{ marginTop: 4 }} /> : <TabsIcon style={{ marginTop: 4 }} />}
                />
              </Tooltip>
            )
            : null}
        >
          <TabPane tab="属性配置" key="1" className={styles['attribute-panel']}>
            <div className={styles['attributes-form-panel']}>
              { renderColumnForm() }
            </div>
          </TabPane>
          <TabPane tab="全局设置" key="2" className={styles['attribute-panel']}>
            <div className={styles['attributes-form-panel']}>
              { renderGlobalForm() }
            </div>
          </TabPane>
          { isDemo && (
          <TabPane tab="表格数据" key="3" className={styles['attribute-panel']}>
            <div className={styles['attributes-code-panel']}>
              { codeErrorMessage && <Alert style={{ margin: '8px 0' }} message={codeErrorMessage} type="error" showIcon /> }
              <MonacoEditor
                width="100%"
                height={428}
                language="json"
                theme="vs-dark"
                value={code || ''}
                onChange={(value) => { submitTableData(value); }}
              />
            </div>
          </TabPane>
          ) }
        </Tabs>
      </div>
    </div>
  );
};

export default AttributeLayout;